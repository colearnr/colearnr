var util = require('../common/util'),
  query = require('../common/query'),
  db = require('../common/db'),
  constants = require('../common/constants'),
  topicRoute = require('./topic'),
  perms = require('../lib/perms'),
  config = require('../lib/config').config,
  userLib = require('../lib/user'),
  extractLib = require('../common/extract'),
  request = require('request'),
  createLbit = require('../common/create_learn_bit'),
  optimiseLib = require('../lib/lbit-optimise'),
  logger = require('../common/log'),
  _ = require('lodash'),
  ejs = require('ejs'),
  analytics = require('./analytics'),
  fs = require('fs'),
  youtubedl = require('youtube-dl'),
  es = require('../common/elasticsearch'),
  GridFS = require('../lib/gridfs'),
  AccessTokens = require('../lib/access-tokens'),
  fse = require('fs-extra'),
  path = require('path'),
  mime = require('mime'),
  SUCCESS = '0',
  ERROR = '1',
  INIT = '2',
  MIN_WORDS = 50,
  UPLOAD_SERVER_PREFIX = config.upload_server_prefix

function save_edit (req, res) {
  var user = req.user
  var newValue = req.body.update_value
  var tid = req.body.element_id
  var oldValue = req.body.original_html
  var sessionid = req.body.sessionid
  var idlist = tid.split('-')
  var id = null,
    type = null
  if (idlist && idlist.length > 1) {
    id = idlist[1]
    type = idlist[2]
  }
  if (type === 'order') {
    if (newValue) {
      newValue = parseInt(newValue, 10)
    }
  }
  if (!id) {
    res.status(500).send('No such id found!')
    return
  }
  /*
   if (!user || !user.hasEditPermission) {
   logger.log('error', 'User', user._id, 'doesn't have edit permission. Learnbit', id, 'not updated!')
   res.status(500).send('Looks like you do not have permission to edit!')
   return
   }
   */
  query.update_learn_bit(id, oldValue, newValue, type, function (err) {
    if (err) {
      res.status(500).send('Error while saving!')
    } else {
      res.send('' + newValue)
      query.get_learnbit(user, {_id: db.ObjectId(id)}, function (err, lbit) {
        if (global.socket) {
          global.socket.emit('send:editlbit', {lbit: lbit, user: user, sessionid: sessionid})
        } else {
          logger.log('warn', 'Unable to push the changes to the clients')
        }
      })
    }
  })
}

function _doCreate (sessionid, topic, oid, order, url, content, req, res, callbackFn) {
  logger.debug('_doCreate', sessionid, url, oid, order)
  createLbit(topic.id, {
    topic_oid: oid,
    order: order,
    url: url,
    body: content,
    path: topic.path,
    author: req.user._id
  }, function (err, lbit, isUpdate) {
    var user = req.user
    if (util.empty(lbit)) {
      res.status(500).send('Oops. There is a problem while saving this url. Please try again later.')
    } else if (isUpdate && util.isExternalLink(lbit.type)) {
      logger.warn('Url already exists in topic', oid, url, topic.path)
      res.status(500).send('This learnbit already exists in this topic!')
    } else {
      // Optimise only external learnbits here. Optimisation for files will be taken care of
      // in upload method
      if (lbit.url.indexOf(constants.CL_PROTOCOL) === -1 &&
        util.isOptimisationSupported(lbit.type, null)
        && (!lbit.optimised || isUpdate) && !lbit.skip_optimisation) {
        // Support for automatically optimising external video source
        if (util.isSupportedVideoSource(lbit.url, lbit.type)
          && !config.force_all_video_optimisation) {
          logger.log('debug', 'Not optimising ' + lbit.url)
        } else {
          optimiseLib.processLearnbit(lbit, function (err, lb) {
            if (err) {
              logger.log('error', 'Unable to optimise pdf', err)
            } if (global.socket) {
              global.socket.emit('send:editlbit', {lbit: lb, user: user})
            } else {
              logger.log('warn', 'Unable to push the changes to the clients')
            }
          })
        }
      }

      if (isUpdate) {
        res.json({status: 'success', message: lbit.title + ' updated successfully', data: null})
        if (global.socket) {
          global.socket.emit('send:editlbit', {lbit: lbit, user: user})
        } else {
          logger.log('warn', 'Unable to push the changes to the clients')
        }
      } else { // Send the full learnbit block
        var sid_id_map = {}
        sid_id_map[oid] = topic.id
        topicRoute.formDiscussUrl(req, topic, user)
        lbit.user_perms = topic.user_perms
        lbit.userObj = user
        res.render('lbits/lbits-full.ejs', {
          lbit: lbit, sid_id_map: sid_id_map,
          topicObj: topic
        }, function (err, ldata) {
          if (ldata) {
            res.json({status: 'success', message: null, data: ldata})
            // Push this to other users
            _pushLbit(req, topic.id, topic._id, [lbit], user, sessionid)
          }
        })
      }
      if (typeof callbackFn === 'function') {
        callbackFn(null, lbit)
      }
    }
  })
}

function save_lbit_url (req, res) {
  var lbit_info = req.body
  // console.log(lbit_info)
  var oid = lbit_info.tid
  if (!oid) {
    res.status(500).send('Oops. There is a problem while saving this url. Please try again later.')
    return
  }
  var sessionid = lbit_info.sessionid
  logger.log('debug', 'Id is', oid, 'sessionid', sessionid)
  var url = util.trim(lbit_info.url) || ''
  url = decodeURIComponent(url) || ''
  var urls = null
  var order = null
  if (url.indexOf('\n') != -1) {
    urls = url.split('\n')
    url = decodeURIComponent(urls[0])
  }

  if (url.indexOf(' ') != -1 && url.indexOf('<iframe') == -1 && url.indexOf('<script') == -1) {
    var tmp = url.split(' ')
    if (tmp && tmp.length) {
      try {
        order = parseInt(tmp[0], 10)
      } catch (e) {
        order = null
      }
      url = tmp[1]
    }

  }

  var content = util.trim(lbit_info.content) || ''
  var fileUploadData = util.parseJson(lbit_info.fileUploadData) || null
  if (util.empty(url) && util.empty(content) && util.empty(fileUploadData)) {
    res.status(500).send('Looks like the link or embed code is invalid!')
    return
  }

  logger.log('debug', 'url', url, 'content', content, fileUploadData)
  if (!util.empty(url) && !util.validUrl(url)) {
    res.status(500).send("Sorry, that's an invalid url.")
    return
  }

  // Handle case where the content is just a link
  if (!util.empty(content) && util.validUrl(content) && content.substring(0, 4) == 'http') {
    url = content
  }
  if (util.empty(url)) {
    url = '#'
  }
  var user = req.user
  if (util.validOid(oid)) {
    query.get_topic(user, {_id: db.ObjectId(oid)}, function (err, topic) {
      if (err || !topic) {
        logger.log('warn', 'No topic found for', oid)
        res.status(500).send('Oops. There is a problem while saving this url. Please try again later.')
        return
      }
      userLib.addUserPerms(req.user, topic, function (user) {
        if (user.hasAddPermission) {
          // logger.log('debug', 'Allowing', user._id, 'to access', oid, id, url)
          if (fileUploadData) {
            var sid_id_map = {}
            var lbit_list = []
            fileUploadData.forEach(function (filedata, index) {
              url = UPLOAD_SERVER_PREFIX + filedata.key
              logger.log('debug', 'Creating new learnbit file', oid, url, content, topic.path)
              var tmpTitle = filedata.filename
              if (tmpTitle.indexOf('.flv') != -1 || tmpTitle.indexOf('.mp4') != -1) {
                tmpTitle = 'Recording by ' + user.displayName
              }
              var tmpA = tmpTitle.split('.')
              tmpTitle = (tmpA && tmpA.length) ? tmpA[0] : tmpTitle

              createLbit(topic.id, {
                topic_oid: oid,
                order: order,
                url: url,
                body: content,
                path: topic.path,
                author: req.user._id,
                title: tmpTitle,
                size: filedata.size
              }, function (err, lbit, isUpdate) {
                if (util.empty(lbit)) {
                  res.status(500).send('Oops. There is a problem while saving this url. Please try again later.')
                } else if (isUpdate) {
                  logger.warn('Url already exists in topic', oid, url, topic.path)
                  res.status(500).send('That url already exists in this topic!')
                } else {
                  // console.log(JSON.stringify(lbit))
                  sid_id_map[oid] = topic.id
                  topicRoute.formDiscussUrl(req, topic, user)
                  lbit.user_perms = topic.user_perms
                  lbit.userObj = user
                  lbit_list.push(lbit)
                  if (lbit_list.length == fileUploadData.length) {
                    res.render('lbits/lbits-full.ejs', {
                      lbit_list: lbit_list, sid_id_map: sid_id_map,
                      topicObj: topic
                    }, function (err, ldata) {
                      res.send(ldata)
                      _pushLbit(req, topic.id, topic._id, lbit_list, user, sessionid)
                    })
                  }
                  if (util.isOptimisationSupported(lbit.type, null) && !lbit.optimised && !lbit.skip_optimisation) {
                    optimiseLib.processLearnbit(lbit, function (err, lb) {
                      if (err) {
                        logger.log('error', 'Unable to optimise pdf', err)
                      } if (global.socket) {
                        global.socket.emit('send:editlbit', {lbit: lb, user: user})
                      } else {
                        logger.log('warn', 'Unable to push the changes to the clients')
                      }
                    })
                  }
                }
              })
            })
          } else if (url != '#' && util.isInternalUrl(url)) {
            var extractedTopic = util.getTopicFromUrl(url)
            var extractedLbit = util.getLbitFromUrl(url)
            var errorMsg = null
            if (!util.empty(extractedTopic) || !util.empty(extractedLbit)) {
              var lbit_id = null
              if (extractedLbit && extractedLbit._id) {
                lbit_id = extractedLbit._id
              } else if (url.indexOf('lbit=') != -1) {
                var lindex = url.indexOf('lbit=')
                lbit_id = url.substring(lindex + 5).split('/')[0]
              }
              var tidToUse = extractedTopic.oid || oid
              if (extractedTopic.oid && extractedTopic.oid == oid) {
                if (!lbit_id) {
                  errorMsg = 'Looks like you are trying to link the same topic onto itself!'
                } else {
                  errorMsg = 'That learnbit already exists in this topic!'
                }
                logger.log('error', errorMsg)
                res.status(500).send(errorMsg)
              } else {
                query.get_topic(user, {_id: db.ObjectId(tidToUse)}, function (err, etopicObj) {
                  if (err || !etopicObj) {
                    errorMsg = 'Oops. There is a problem while saving this topic url. Please contact support.'
                  } else {
                    if (lbit_id) { // Is this a learnbit share url?
                      logger.log('debug', 'Creating new learnbit', oid, lbit_id)
                      createLbit(topic.id, {_id: lbit_id, topic_oid: oid}, function (err, lbit, isUpdate) {
                        if (util.empty(lbit)) {
                          res.status(500).send('Oops. There is a problem while saving this url. Please try again later.')
                        } else if (isUpdate) {
                          logger.warn('Url already exists in topic', oid, url, topic.path)
                          res.status(500).send('That learnbit already exists in this topic!')
                        } else {
                          // console.log(JSON.stringify(lbit))
                          var sid_id_map = {}
                          sid_id_map[oid] = topic.id
                          topicRoute.formDiscussUrl(req, topic, user)
                          lbit.user_perms = topic.user_perms
                          lbit.userObj = user
                          res.render('lbits/lbits-full.ejs', {
                            lbit: lbit, sid_id_map: sid_id_map,
                            topicObj: topic
                          }, function (err, ldata) {
                            res.send(ldata)
                            _pushLbit(req, topic.id, topic._id, [lbit], user, sessionid)
                          })
                        } // else
                      })
                    } else { // This should be a topic url
                      // Check if the user has view access
                      if (etopicObj.user_perms && etopicObj.user_perms[req.user._id] && _.indexOf(etopicObj.user_perms[req.user._id], constants.VIEW_PERMS) != -1) {
                        query.add_linked_topic(user, topic, etopicObj, function (err) {
                          if (err) {
                            errorMsg = err
                            logger.log('error', 'Unable to link topic', errorMsg)
                            res.status(500).send(errorMsg)
                          } else {
                            // Topic got added successfully as a sub-topic
                            res.send({redirectUrl: '/topic/' + topic._id + '/'})
                          }
                        })
                      } else {
                        errorMsg = "Looks like you don't have permission to access this topic. Please contact support."
                        logger.log('error', errorMsg)
                        res.status(500).send(errorMsg)
                      }
                    }
                  }
                })
              }
            } else if (util.isCloudUrl(url)) { // Is it a cloud url
              logger.log('debug', 'Creating new learnbit cloud url', oid, url, content, topic.path)
              _doCreate(sessionid, topic, oid, order, url, content, req, res)
            } else { // Not a topic or lbit url
              errorMsg = 'Oops. There is a problem while saving this url. Please contact support.'
              if (errorMsg) {
                logger.log('warn', url, 'is not an internal url!')
                res.status(500).send(errorMsg)
              }
            }
          } else {
            logger.log('debug', 'Creating new learnbit content', oid, url, topic.path)
            _doCreate(sessionid, topic, oid, order, url, content, req, res)
          }
        } else {
          res.status(500).send("Looks like you don't have permission to add content to this page. Please contact support.")
        }
      })
    })
  } else {
    res.status(500).send('Oops. There is a problem while saving this url. Please try again later.')
    return
  }
}

function del_lbit (req, res) {
  var user = req.user
  var lbit_info = req.body
  var sessionid = req.body.sessionid
  var tmpid = lbit_info.id
  var tmpA = tmpid.split('-')
  var id = null
  var topicid = lbit_info.topicId
  if (!tmpA || tmpA.length > 1) {
    if (!topicid) {
      topicid = tmpA[0]
    }
    id = tmpA[1]
  }

  if (!id || !topicid) {
    res.status(500).send('Oops. There is a problem while deleting this lbit. Please try again later.')
    return
  }
  logger.log('info', 'About to unlink learnbit', id, 'from topic', topicid)
  db.learnbits.update({_id: db.ObjectId(id)}, {$pull: {topics: {_id: db.ObjectId(topicid)}}}, {$set: {last_updated: new Date()}}, function (err) {
    if (err) {
      logger.log('error', 'Unable to delete learnbit', id, err)
      res.status(500).send('Unable to delete the learnbit. Please try after some time.')
    } else {
      res.send(SUCCESS)
      if (global.socket) {
        global.socket.emit('send:dellbit', {data: id, topic: {_id: topicid}, user: user, sessionid: sessionid})
      } else {
        logger.log('warn', 'Unable to push the new learnbit to the clients')
      }
    }
  })

  db.learnbits.findOne({_id: db.ObjectId(id)}, function (err, lbit) {
    if (lbit.url.indexOf(constants.CL_PROTOCOL) === 0) {
      GridFS.remove(id, null, function (err) {
        if (err) {
          logger.warn('learnbit', id, 'not removed from Grid due to', err)
        } else {
          logger.debug(id, 'removed from grid successfully')
        }
      })
      db.learnbits.remove({_id: db.ObjectId(id)}, function (err) {
        if (err) {
          logger.warn('learnbit', id, 'not removed from topic due to', err)
        } else {
          logger.debug(id, 'removed from topic successfully')
        }
      })
    }
  })
}

function edit_form (req, res) {
  var oid = req.params.oid
  var user = req.user
  if (!util.validOid(oid)) {
    res.status(500).send('Invalid learnbit id!')
    return
  }
  db.learnbits.findOne({_id: db.ObjectId(oid)}, function (err, lbit) {
    if (err) {
      res.status(500).send('Unable to load the learnbit. Please try after sometime.')
      return
    }
    if (!lbit) {
      res.status(500).send('Invalid learnbit id!')
      return
    }

    var topics = lbit.topics
    var tags = lbit.tags
    if (topics) {
      var topicids = []
      lbit.topics.forEach(function (atopic) {
        topicids.push(atopic._id)
      })
      query.get_topics(user, {_id: {$in: topicids}}, false, function (err, tmptopiclist) {
        var topiclist = []
        if (err) {
          logger.log('error', 'Error retrieving topiclist', err)
        }
        if (tmptopiclist) {
          tmptopiclist.forEach(function (at) {
            topiclist.push({id: at._id, text: at.name})
          })
        }
        res.render('lbits/lbit-form.ejs', {
          lbit: lbit, error: null, topicObj: null,
          topiclist: topiclist.length ? JSON.stringify(topiclist) : '',
          taglist: tags ? '[' + JSON.stringify(tags) + ']' : '[]', mode: 'edit'
        })
      })
    } else {
      res.render('lbits/lbit-form.ejs', {
        lbit: lbit,
        error: null,
        topicObj: null,
        topiclist: '',
        taglist: '[]',
        mode: 'edit'
      })
    }
  })
}

function save_edit_full (req, res) {
  // console.log(req.body)
  var user = req.user
  var update_map = {'last_updated': new Date()}
  var oid = req.body.oid
  var type = req.body.type
  var sessionid = req.body.sessionid
  var topic_id = req.body.topic_id
  var topic_oid = req.body.topic_oid
  var start = req.body.start
  var end = req.body.end
  var isNew = util.empty(oid)
  var errorStr = ''
  // Support for start and end
  if (type == 'pdf' || type == 'video' || type == 'youtube' || type == 'vimeo') {
    update_map.start = start ? parseInt(start, 10) : null
    update_map.end = end ? parseInt(end, 10) : null
    if (update_map.end && update_map.start && update_map.end < update_map.start) {
      errorStr = 'End position cannot be less than start position'
      res.status(500).send(errorStr)
      return
    }
  }
  logger.log('debug', 'isNew', isNew, topic_id, 'oid', oid)
  if (!isNew && (!util.validOid(oid) || !req.body.topics)) {
    errorStr = 'Learnbit should be assigned to atleast one topic!'
    if (!oid) {
      errorStr = 'Unable to find the original learnbit for editing!'
    }
    res.status(500).send(errorStr)
    return
  }

  if (isNew && (util.empty(req.body.title) && util.empty(req.body.description) && util.empty(req.body.body))) {
    var errorStr = 'We need something to save!'
    res.status(500).send(errorStr)
    return
  }

  update_map['title'] = req.body.title || ''
  update_map['topic_oid'] = topic_oid
  update_map['type'] = type
  if (type == 'html') {
    update_map['disable_optimisation'] = (req.body.disable_optimisation == 'true' ? true : false)
  }
  update_map['draft_mode'] = (req.body.draft_mode == 'true' ? true : false)
  update_map['description'] = req.body.description || null
  update_map['license'] = req.body.license
  if (req.body.topics) {
    var tmpA = req.body.topics.split(',')
    var topiclist = []
    tmpA.forEach(function (str) {
      topiclist.push({_id: db.ObjectId(str)})
    })
    update_map['topics'] = topiclist
  }
  update_map['order'] = req.body.order ? parseInt(req.body.order) : null
  if (req.body.tags) {
    update_map['tags'] = req.body.tags
  } else {
    update_map['tags'] = null
  }
  if (req.body.url) {
    update_map['url'] = req.body.url
  }
  if (req.body['img_url']) {
    update_map['img_url'] = util.parseJson(req.body['img_url'])
  }
  if (!util.empty(req.body.body)) {
    if (req.body.type == 'poll') {
      var body = {body: req.body.body}
      var choices = []
      for (var c = 0; c < parseInt(req.body.total_choices, 10); c++) {
        var text = req.body['choice_' + (c + 1)]
        if (!util.empty(text)) {
          choices.push({id: c, text: text})
        }
      }
      if (!choices.length) {
        var errorStr = 'A good poll is as good as its options!'
        res.status(500).send(errorStr)
        return
      }
      body['choices'] = choices
      update_map['body'] = util.stringify(body)
    } else {
      update_map['body'] = req.body.body
    }
  } else {
    if (req.body.type == 'poll') {
      var errorStr = 'What question would you like to ask as part of this poll?'
      res.status(500).send(errorStr)
      return
    }
  }
  if (req.body.type == 'video' || req.body.type == 'youtube') {
    var chapters = []
    for (var c = 0; c < parseInt(req.body.total_chapters, 10); c++) {
      var text = req.body['chapter_' + (c + 1)]
      var time = req.body['time_' + (c + 1)]
      if (time) {
        time = parseInt(time, 10)
      }
      if (!util.empty(text) && !util.empty(time)) {
        chapters.push({time: time, text: text})
      }
    }
    chapters = _.sortBy(chapters, function (achapter) {
      return achapter.time
    })
    update_map['track_chapters'] = chapters
    update_map['video_duration'] = req.body.video_duration ? parseFloat(req.body.video_duration) : null
  }
  if (isNew) {
    update_map['url'] = '#'
    update_map['author'] = req.user._id
  }

  if (req.body.privacy_mode && req.body.privacy_mode == 'public') {
    update_map['privacy_mode'] = 'public'
  } else {
    update_map['privacy_mode'] = 'private'
  }

  if (isNew) {
    createLbit(topic_id, update_map, function (err, lbit, isUpdate) {
      if (err || !lbit) {
        res.status(500).send('Error while updating learnbit. Please try again later.')
      } else {
        res.send({id: lbit._id})
        lbit.userObj = user
        _pushLbit(req, topic_id, topic_oid, [lbit], user, sessionid)
      }
    })
  } else {
    db.learnbits.findOne({_id: db.ObjectId(oid)}, function (err, lbit) {
      if (err) {
        res.status(500).send('Unable to find the original learnbit for editing!')
      } else if (!lbit) {
        createLbit(topic_id, update_map, function (err, lbit, isUpdate) {
          if (err || !lbit) {
            res.status(500).send('Error while updating learnbit. Please try again later.')
          } else {
            lbit.userObj = user
            res.send({id: lbit._id})
            _pushLbit(req, topic_id, topic_oid, [lbit], user, sessionid)
          }
        })
      } else {
        if (lbit.type == 'quote') {
          var quote_author = req.body.quote_author || ''
          var bodyObj = {quote: update_map['body'], author: quote_author}
          update_map['body'] = util.stringify(bodyObj)
        // console.log('Body', update_map['body'])
        }
        db.learnbits.update(
          {_id: db.ObjectId(oid)},
          {$set: update_map}, function (err, lbit) {
            if (err || !lbit) {
              res.status(500).send('Error while updating learnbit. Please try again later.')
            } else {
              res.send({id: lbit._id})
            }
          })

        query.get_learnbit(user, {_id: db.ObjectId(oid)}, function (err, lbit) {
          if (global.socket) {
            global.socket.emit('send:editlbit', {lbit: lbit, user: user, sessionid: sessionid})
          } else {
            logger.log('warn', 'Unable to push the changes to the clients')
          }
        })
      }
    })
  }
}

function _pushLbit (req, topic_id, topic_oid, lbit_list, user, sessionid) {
  // console.log('push lbit', topic_id, topic_oid, lbit, user, sessionid)
  var sid_id_map = {}
  sid_id_map[topic_oid] = topic_id
  var topicObj = {_id: topic_oid, id: topic_id}
  topicRoute.formDiscussUrl(req, topicObj, user)
  lbit_list.forEach(function (albit) {
    if (albit) {
      albit.user_perms = null
      albit.user_role = null
    }
  })
  topicObj.user_perms = null
  topicObj.user_role = null
  var LBITS_TPL_NAME = __dirname + '/../views/lbits/lbits-full.ejs'
  var template = fs.readFileSync(LBITS_TPL_NAME, 'utf8')
  var durl = config.socket.address + ( (config.socket.port != 80 && config.socket.port != 443) ? ':' + config.socket.port : '')
  var host_url = config.base_url + (config.use_port ? (':' + config.port) : '')
  var ldata = ejs.render(template, {
    filename: LBITS_TPL_NAME,
    lbit_list: lbit_list,
    sid_id_map: sid_id_map,
    topicObj: topicObj,
    util: util,
    constants: constants,
    config: config,
    perms: perms,
    page_options: {cdn_prefix: config.cdn_prefix},
    user: user,
    _: _,
    durl: durl,
    host_url: host_url
  })
  if (global.socket) {
    global.socket.emit('send:newlbit', {
      data: ldata,
      lbit_list: lbit_list,
      topic: topicObj,
      user: user,
      sessionid: sessionid
    })
  } else {
    logger.log('warn', 'Unable to push the new learnbit to the clients')
  }
}

function view_media (req, res) {
  var oid = req.params.oid,
    user = req.user || constants.DEMO_USER

  if (!util.validOid(oid)) {
    res.status(500).send('Invalid media id!')
    return
  }

  GridFS.readFile(oid, null, null, function (err, filestream) {
    if (err) {
      res.status(500).send('Problem fetching your media!')
      return
    }
    logger.debug('About to stream file from Grid', oid)
    filestream.pipe(res)
  })
}

function view_lbit_media (req, res) {
  var oid = req.params.oid,
    fname = req.params.fname,
    user = req.user || constants.DEMO_USER

  if (!util.validOid(oid)) {
    res.status(500).send('Invalid media id!')
    return
  }
  GridFS.readFile(null, {lbit_id: oid, filename: fname}, null, function (err, filestream) {
    if (err) {
      res.status(500).send('Problem fetching your media!')
      return
    }
    var contentType = mime.lookup(fname)
    res.set('Content-Type', contentType)
    logger.debug('About to stream file from Grid', oid)
    filestream.pipe(res)
  })

}

function view (req, res) {
  var oid = req.params.oid,
    topicId = req.query.topic_id,
    user = req.user || constants.DEMO_USER

  if (!util.validOid(oid)) {
    res.status(500).send('Invalid learnbit id!')
    return
  }
  query.get_learnbit(user, {_id: db.ObjectId(oid)}, function (err, lbit) {
    if (err || !lbit) {
      res.status(500).send('Unable to load learnbit. Please try after some time.')
      logger.log('error', 'Unable to view learnbit', err, oid)
      return
    } else {
      if (!topicId) {
        topicId = (lbit.topics && lbit.topics.length && lbit.topics[0]) ? lbit.topics[0]._id : null
      }
      query.get_topic(user, {_id: db.ObjectId(topicId)}, function (err, topic) {
        if (err) {
          res.status(500).send('Unable to retrieve the topic for the learnbit. Please try after some time.')
          logger.log('error', 'Unable to retrieve the topic for the learnbit. Please try after some time.', err, topicId)
          return
        } else {
          analytics.lbit_track(req)
          if (topic) {
            lbit.user_role = topic.user_role
            lbit.user_perms = topic.user_perms
            logger.log('debug', lbit.user_perms, 'got copied to the learnbit', oid)
          }
          if ((lbit.type == 'html' && lbit.disable_optimisation !== true) || lbit.type == 'inline-html') {
            if ((lbit.body && lbit.body.split(' ').length > MIN_WORDS) || lbit.url == '#' || lbit.type == 'inline-html') {
              res.render('lbits/readable.ejs', {lbit: lbit, user: user, topicId: topicId})
            } else if (!util.empty(lbit.url) && util.validUrl(lbit.url)) {
              extractLib.parse(lbit.url, function (data) {
                if (data.data && data.data.error) {
                  logger.error(data.data.messages, '. Tried url', lbit.url)
                }
                logger.log('debug', lbit.url, data.rendered_pages, data.word_count)
                if (!data.error && data.rendered_pages > 0 && data.word_count > MIN_WORDS) {
                  lbit.body = data.content
                  res.render('lbits/readable.ejs', {lbit: lbit, user: user, topicId: topicId})
                  db.learnbits.save(lbit, function (err) {
                    if (!err && lbit) {
                      logger.log('info', lbit.url, 'updated successfully with content.')
                    }
                  })
                } else {
                  res.redirect(lbit.url)
                }
              })
            } else {
              res.redirect(lbit.url)
            }
          } else if (lbit.type === 'pdf') {
            query.get_pdf_last_position(user, lbit._id, topicId, function (err, lastPosition) {
              AccessTokens.create('' + lbit._id, { added_by: user._id, valid_for_users: [user._id], ttl: 30 * 60, domain: constants.ALLOWED_EMBED_DOMAINS }, function (err, accessToken) {
                res.render('lbits/embedded.ejs', {lbit: lbit, user: user, topicId: topicId, lastPosition: lastPosition, accessToken: accessToken})
              })
            })
          } else if (lbit.type === 'iframe-embed' || lbit.optimised || lbit.type === 'office') {
            AccessTokens.create('' + lbit._id, { added_by: user._id, valid_for_users: [user._id], ttl: 30 * 60, domain: constants.ALLOWED_EMBED_DOMAINS }, function (err, accessToken) {
              res.render('lbits/embedded.ejs', { lbit: lbit, user: user, topicId: topicId, accessToken: accessToken })
            })
          } else if (lbit.type === 'poll') {
            res.render('polls/poll-view.ejs', {lbit: lbit, user: user, topicId: topicId})
          } else {
            res.redirect(lbit.url)
          }
        }
      })
    }
  })
}

function download (req, res) {
  var user = req.user
  var oid = req.params['oid']
  if (!util.validOid(oid)) {
    res.status(500).send('Invalid learnbit id!')
    return
  }

  query.get_learnbit(user, {_id: db.ObjectId(oid)}, function (err, lbit) {
    if (err || !lbit) {
      res.status(500).send('Unable to load learnbit. Please try after some time.')
      logger.log('error', 'Unable to load learnbit. Please try after some time.', err, oid)
      return
    } else {
      var url = lbit.url
      if (util.isCloudUrl(url)) {
        url = util.encode_s3_url(url)
      }
      if (util.isDownloadSupported(lbit.type, null)) {
        if (util.isSupportedVideoSource(lbit.url, lbit.type)) {
          var video = youtubedl(lbit.url,
            ['--max-filesize', constants.MAX_DOWNLOAD_SIZE, '--format', 'mp4'],
            { cwd: '/tmp' })
          video.on('info', function (info) {
            logger.debug('Download started for', lbit.url)
            logger.debug('filename: ' + info._filename)
            logger.debug('size: ' + info.size)
            if (info.size > constants.MAX_DOWNLOAD_SIZE) {
              res.status(500).send('This video is too big for download!')
              return
            } else {
              res.set('Content-disposition', 'attachment; filename="' + lbit.title + '.mp4"')
              video.pipe(res)
            }
          })
        } else {
          var extension = util.getExtension(lbit.url)
          logger.debug('Downloading ', lbit.url)
          res.set('Content-disposition', 'attachment; filename="' + lbit.title + extension + '"')
          // Check if the file exists in the Grid by checking the url for CL protocol
          if (url.indexOf(constants.CL_PROTOCOL) === 0) {
            GridFS.readFile(oid, null, null, function (err, filestream) {
              if (err) {
                res.status(500).send('Problem fetching your learnbit!')
                return
              }
              logger.debug('About to download file from Grid', oid)
              filestream.pipe(res)
            })
          } else {
            request.get(url)
              .on('response', function (response) {
                if (response.statusCode != 200) {
                  logger.log('warn', 'Unable to download', url, '. Response code:', response.statusCode)
                }
              })
              .on('error', function (err) {
                logger.error('Unable to download url', url, err)
                res.end()
              })
              .pipe(res)
          }
        }
        analytics.lbit_track(req)
      } else {
        res.status(500).send('Download is not supported for this learnbit')
      }
    }
  })
}

function create_new (req, response) {
  var topic_oid = req.query.topic_id
  var lbit = {type: 'inline-html'}
  if (util.validOid(topic_oid)) {
    db.topics.findOne({_id: db.ObjectId(topic_oid)}, function (err, topic) {
      var topiclist = [{id: topic._id, text: topic.name}]
      var dataMap = {topic: topic, lbit: lbit, topiclist: util.stringify(topiclist), newlbit: true}
      response.render('lbits/lbit-creator.ejs', dataMap)
    })
  } else {
    logger.warn('Unable to find the topic for the new learnbit')
    var dataMap = {topic: null, lbit: lbit, topiclist: null, newlbit: true}
    response.render('lbits/lbit-creator.ejs', dataMap)
  }
}

function redirect_url (req, res) {
  var oid = req.params.oid
  var type = req.params.type
  if (!util.validOid(oid)) {
    res.status(500).send('Invalid learnbit id!')
    return
  } else {
    db.learnbits.findOne({_id: db.ObjectId(oid)}, function (err, lbit) {
      if (err || !lbit) {
        res.status(500).send('Unable to load learnbit. Please try after some time.')
        console.error('Unable to load learnbit', err, oid)
      } else {
        var url = util.encode_s3_url(lbit.url)
        if (lbit.type == 'pdf') {
          res.set('Content-Type', 'application/pdf')
        } else {
          var contentType = mime.lookup(lbit.url)
          res.set('Content-Type', contentType)
        }
        // Check if the file exists in the Grid by checking the url for CL protocol
        if (url.indexOf(constants.CL_PROTOCOL) === 0) {
          GridFS.readFile(oid, null, null, function (err, filestream) {
            if (err) {
              res.status(500).send('Problem fetching your learnbit!')
              return
            }
            // logger.debug('About to stream file from Grid', oid)
            filestream.pipe(res)
          })
        } else {
          logger.log('info', 'Proxying data from', url)
          request.get(url)
            .on('response', function (response) {
              if (response.statusCode != 200) {
                logger.log('warn', 'Unable to proxy', url, '. Response code:', response.statusCode)
              }
            })
            .on('error', function (err) {
              logger.error('Unable to proxy url', url, err)
            })
            .pipe(res)
        }
      }
    })
  }
}

function search (req, response, isApi) {
  var q = req.query.q,
    autoComplete = req.query.ac == '1',
    user = req.user
  if (!q) {
    return response.json({})
  }
  es.findLearnbits({query: q, user: user, autoComplete: autoComplete}, constants.DEFAULT_SEARCH_PAGE_SIZE, function (err, data) {
    if (err) {
      logger.error('Error retrieving search results for learnbits', err)
      response.json({})
      return

    }
    response.json(data)
  })
}

function like (req, response) {
  var lbit_id = req.query.lbit_id
  var liked = true
  var user = req.user
  db.learnbits.findOne({_id: db.ObjectId('' + lbit_id)}, function (err, lbit) {
    if (err || !lbit) {
      response.send(500, 'Invalid learnbit!')
    } else {
      if (!lbit.likes) {
        lbit.likes = []
      }
      if (lbit.likes.indexOf(user._id) != -1) {
        lbit.likes = _.filter(lbit.likes, function (id) {
          return id != '' + user._id
        })
        liked = false
      } else {
        lbit.likes.push('' + user._id)
      }
      db.learnbits.save(lbit, function (err, nlbit) {
        if (!err) {
          response.send({liked: liked, likes: lbit.likes.length})
          analytics.lbit_track(req)
        } else {
          logger.log('error', 'Error while liking lbit', err, lbit_id)
          response.send(500, 'Unable to like this learnbit')
        }
      })
    }
  })
}

function view_tracks (req, res) {
  var oid = req.params['oid']
  var type = req.params['type']
  var user = req.user
  if (!util.validOid(oid)) {
    res.status(500).send('Invalid learnbit id!')
    return
  }
  if (util.empty(type)) {
    res.status(500).send('Invalid track requested')
    return
  }

  query.get_learnbit(user, {_id: db.ObjectId(oid)}, function (err, lbit) {
    if (err || !lbit) {
      res.status(500).send('Unable to load learnbit. Please try after some time.')
      logger.log('error', 'Unable to load learnbit. Please try after some time.', err, oid)
      return
    } else {
      var track_list = lbit['track_' + type] || ''
      var vttData = util.createWebVTT(track_list, lbit.video_duration || null)
      res.send(vttData)
    }
  })
}

function optimise (req, res) {
  var user = req.user,
    sessionid = req.body.sessionid
  oid = req.params.oid
  if (!util.validOid(oid)) {
    res.status(500).send('Invalid learnbit id!')
    return
  }

  query.get_learnbit(user, {_id: db.ObjectId(oid)}, function (err, lbit) {
    if (err || !lbit) {
      res.status(500).send('Unable to optimise learnbit. Please try after some time.')
      logger.log('error', 'Invalid learnbit', err, oid)
      return
    } else {
      if (util.isOptimisationSupported(lbit.type, null)) {
        res.send({started: true})
        optimiseLib.processLearnbit(lbit, function (err, lb) {
          if (err) {
            logger.log('error', 'Error during optimisation of lbit', err, oid)
          } else {
            if (global.socket) {
              global.socket.emit('send:editlbit', {lbit: lb, user: user, sessionid: sessionid})
            } else {
              logger.log('warn', 'Unable to push the changes to the clients')
            }
          }
        })
      }
    }
  })
}

function upload (req, res) {
  var fstream
  var topic_oid = req.headers['cl-upload-topic'] || ''
  var sessionid = req.headers['cl-sessionid'] || ''
  topic_oid = topic_oid.split(',')[0]
  sessionid = sessionid.split(',')[0]
  var user = req.user,
    userPath = path.join(config.upload_base_dir, user._id)
  if (util.validOid(topic_oid)) {
    query.get_topic(user, { _id: db.ObjectId(topic_oid) }, function (err, topic) {
      if (err || !topic) {
        logger.log('warn', 'No topic found for', topic_oid)
        res.status(500).send('Oops. There is a problem while saving this url. Please try again later.')
        return
      }
      userLib.addUserPerms(user, topic, function (user, perms) {
        if (user.hasAddPermission) {
          req.pipe(req.busboy)
          fse.ensureDirSync(userPath)
          req.busboy.on('file', function (fieldname, file, filename) {
            var fullPath = userPath + '/' + filename
            logger.log('info', 'Receiving: ' + filename + ' from user ' + user._id, 'for topic', topic_oid)
            fstream = fs.createWriteStream(fullPath)
            file.pipe(fstream)
            fstream.on('close', function () {
              // res.json({ filename: filename, status: 'success' })
              var clUrl = constants.CL_PROTOCOL + user._id + '/' + encodeURIComponent(filename)
              logger.debug(filename, 'uploaded successfully to', userPath)
              logger.log('debug', 'Creating new learnbit', topic_oid, topic.path, clUrl)
              _doCreate(sessionid, topic, topic_oid, null, clUrl, null, req, res, function (err, newLbit) {
                // Add to GridFS
                GridFS.storeFile(fullPath, {_id: newLbit._id, added_by: newLbit.added_by, topic_id: topic._id}, function (err, fileObj) {
                  if (!err) {
                    logger.info('Stored file ' + filename + ' in grid as ' + fileObj._id)
                    newLbit.url = clUrl
                    if (util.isOptimisationSupported(newLbit.type, null)
                      && (!newLbit.optimised) && !newLbit.skip_optimisation) {
                      // Support for automatically optimising external video source
                      if (util.isSupportedVideoSource(newLbit.url, newLbit.type)
                        && !config.force_all_video_optimisation) {
                        logger.log('debug', 'Not optimising ' + newLbit.url)
                        return
                      }
                      optimiseLib.processLearnbit(newLbit, function (err, lb) {
                        if (err) {
                          logger.log('error', 'Unable to optimise pdf', err)
                          return
                        }
                        if (global.socket) {
                          global.socket.emit('send:editlbit', {lbit: lb, user: user})
                        } else {
                          logger.log('warn', 'Unable to push the changes to the clients')
                        }
                      })
                    }
                  }
                })
              })
            })
          })
        } else {
          res.status(500).json({ message: 'Permission denied' })
          logger.warn(user._id, 'does not have add permission for topic', topic_oid)
        }
      })
    })
  }
}

function media_upload (req, res) {
  var fstream
  var topic_oid = req.headers['cl-upload-topic']
  var sessionid = req.headers['cl-sessionid']
  var oid = req.params.oid,
    user = req.user,
    userPath = path.join(config.upload_base_dir, user._id, 'media')
  if (util.validOid(oid)) {
    query.get_learnbit(user, {_id: db.ObjectId(oid)}, function (err, lbit) {
      if (err || !lbit) {
        res.status(500).send('Unable to add media to learnbit. Please try after some time.')
        logger.log('error', 'Invalid learnbit', err, oid)
        return
      } else {
        req.pipe(req.busboy)
        fse.ensureDirSync(userPath)
        req.busboy.on('file', function (fieldname, file, filename) {
          var fullPath = userPath + '/' + filename
          logger.log('info', 'Receiving: ' + filename + ' from user ' + user._id, 'for topic', topic_oid)
          fstream = fs.createWriteStream(fullPath)
          file.pipe(fstream)
          fstream.on('close', function () {
            var clUrl = constants.CL_PROTOCOL + user._id + '/' + encodeURIComponent(filename)
            logger.debug(filename, 'uploaded successfully to', userPath)
            // Add to GridFS
            GridFS.storeFile(fullPath, {lbit_id: lbit._id, added_by: lbit.added_by, topic_id: topic_oid}, function (err, fileObj) {
              logger.info('Stored file ' + filename + ' in grid as ' + fileObj._id)
              res.json({file: fileObj})
            })
          })
        })
      }
    })
  }
}

exports.save_edit = function (req, res) {
  save_edit(req, res)
}

exports.save_lbit_url = function (req, res) {
  save_lbit_url(req, res)
}

exports.del_lbit = function (req, res) {
  del_lbit(req, res)
}

exports.edit_form = function (req, res) {
  edit_form(req, res)
}

exports.save_edit_full = function (req, res) {
  save_edit_full(req, res)
}

exports.view = function (req, res) {
  view(req, res)
}

exports.view_media = function (req, res) {
  view_media(req, res)
}

exports.view_lbit_media = function (req, res) {
  view_lbit_media(req, res)
}

exports.download = function (req, res) {
  download(req, res)
}

exports.upload = function (req, res) {
  upload(req, res)
}

exports.media_upload = function (req, res) {
  media_upload(req, res)
}

exports.optimise = function (req, res) {
  optimise(req, res)
}

exports.create_new = function (req, response) {
  create_new(req, response)
}

exports.redirect_url = function (req, res) {
  redirect_url(req, res)
}

exports.search = function (req, res) {
  search(req, res, false)
}

exports.search_api = function (req, res) {
  search(req, res, true)
}

exports.like = function (req, res) {
  like(req, res)
}

exports.view_tracks = function (req, res) {
  view_tracks(req, res)
}
