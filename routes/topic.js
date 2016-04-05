'use strict'

let util = require('../common/util')
let topicMapUtil = require('../common/util/topicMapUtil')
let query = require('../common/query')
let config = require('../lib/config').config
let perms_lib = require('../lib/perms')
let user_lib = require('../lib/user')
let db = require('../common/db')
let analytics = require('./analytics')
let constants = require('../common/constants')
let logger = require('../common/log')
let Step = require('step')
let wait = require('wait.for')
let fs = require('fs')
let GridFS = require('../lib/gridfs')
let fse = require('fs-extra')
let path = require('path')
let es = require('../common/elasticsearch')
let async = require('async')
let _ = require('lodash')
// Number of recent learn bits to show
let LIMIT_RECENT_BITS = 10

function get_discuss_host (req) {
  let config_lib = require('../lib/config')
  let hostname = req.headers['host'] ? req.headers['host'].split(':')[0] : '127.0.0.1'
  let config = config_lib.config.use_client_host ? config_lib.configure(hostname) : config_lib.config
  return config.socket.address + ((config.socket.port !== 80 && config.socket.port !== 443) ? ':' + config.socket.port : '')
}

function formDiscussUrl (req, atopic, user) {
  let discussUrl = '#'
  if (atopic) {
    if (atopic.discuss_id) {
      discussUrl = get_discuss_host(req) + '/topic/user/' + user._id + '/by_objid/' + atopic.discuss_id
    } else {
      discussUrl = get_discuss_host(req) + '/topic/user/' + user._id + '/' + atopic._id
    }

    atopic.topic_discussion_url = discussUrl
  }
}

function get_topic (req, response, callback) {
  let parent_category = req.params['parent_category'] || null
  let topicname = req.params['topicname'] || req.params['id'] || null
  let topic_oid = req.params['topic_oid'] || req.params['oid'] || null
  let user = req.user
  logger.log('debug', 'Get_topic', 'p', parent_category, 'n', topicname, 'i', topic_oid)
  if (util.empty(topicname) && util.empty(topic_oid)) {
    callback(null, null)
  } else {
    query.get_topics_by_name_id(user, parent_category, topicname, topic_oid, callback)
  }
}

function process (req, response) {
  // Clear the map for each request.
  let retMap = {}
  let user = req.user
  let noChildMode = req.query && (req.query.noChild === 'true' || req.query.noChild === '1')
  let topicname = req.params['topicname'] || req.params['id'] || null
  function addData (key, data) {
    if (key) {
      let d = {}
      d[key] = data
      // console.log(key, JSON.stringify(data))
      _.merge(retMap, d)
    }
  }

  function render (req, response) {
    let data = retMap
    // data['user'] = req.user
    // console.log(data)
    if (!data.topicObj.hidden) {
      let recently_viewed = {
        _id: data.topicObj._id,
        id: data.topicObj.id,
        name: data.topicObj.name,
        privacy_mode: data.topicObj.privacy_mode,
        last_updated: data.topicObj.last_updated,
        added_date: data.topicObj.added_date,
        submenuList: data.firstChilds ? data.firstChilds : data.subtopics,
        collaborators: data.topicObj.collaborators,
        colearnrs: data.topicObj.colearnrs,
        added_by: data.topicObj.added_by,
        hidden: data.topicObj.hidden
      }
      if (req.session && req.session.push) {
        req.session.push(recently_viewed)
      }
    }
    response.render('topic.ejs', data)
    req.query = {
      topic_id: data.topicObj._id,
      e: 'view'
    }
    analytics.topic_track(req)
  }

  // let id = req.params['id']
  // let sortOrder = req.params['sortOrder']
  // Get the topic object
  get_topic(req, response, function (err, topicParentMap) {
    if (err) {
      logger.error(err)
    }
    if (!topicParentMap || !topicParentMap['topic']) {
      // console.log("No such topic")
      response.render('404.ejs', {topicname: topicname})
      return
    }
    let atopic = topicParentMap['topic']
    // let topicname = atopic.name
    // Redirect saved search topics
    if (atopic.type === 'search') {
      response.redirect('/search?q=' + atopic.name)
      return
    }
    let sid_id_map = {}
    formDiscussUrl(req, atopic, user)
    addData('discussion_url', get_discuss_host(req))
    addData('topicObj', atopic)
    addData('subtopics', [])
    addData('virtual_learnbits', {})
    addData('linkedTopics', [])
    addData('sid_id_map', sid_id_map)
    addData('parents', topicParentMap['parents'])
    // HACK: Find if this is the help page, so that we can show a support widget.
    if (atopic.id === constants.HELP_PAGE_ID && atopic.path === null) {
      addData('isHelpPage', true)
    }

    Step(
      function addUserPerms () {
        // Add the permissions available for the user
        user_lib.addUserPerms(user, atopic, this)
      },
      function checkPerms () {
        let self = this
        perms_lib.checkTopicViewAccess(user, atopic, function (err, res) {
          if (!err && !res) {
            if (user.guestMode) {
              response.redirect('/login')
            } else {
              logger.log('warn', 'User', user._id, "doesn't have view permission for topic", atopic._id)
              response.render('error-500.ejs', {
                message: "Looks like you don't have permission to view this topic. Please contact support!"
              })
            }
            return
          } else {
            self()
          }
        })
      },
      function fetchLinkedTopics () {
        let self = this
        if (!util.empty(atopic.link_out) || !util.empty(atopic.link_in)) {
          let allLinks = []
          if (atopic.link_out) {
            allLinks = allLinks.concat(util.listify(atopic.link_out))
          }
          if (atopic.link_in) {
            allLinks = allLinks.concat(util.listify(atopic.link_in))
          }
          let linkArgs = util.convert_links(allLinks)
          if (!util.empty(linkArgs)) {
            query.get_topics(user, linkArgs, false, function (err, tmptopiclist) {
              if (err) {
                logger.error(err)
              }
              tmptopiclist.forEach(function (c) {
                perms_lib.checkTopicViewAccess(user, c, function (err, res) {
                  if (err) {
                    logger.error(err)
                  }
                  if (res) {
                    sid_id_map[c._id] = c.id
                  }
                })
              })
              addData('linkedTopics', tmptopiclist)
              self()
            })
          } else {
            self()
          }
        } else {
          self()
        }
      },
      function doProcess () {
        // First get the learn bits at this topic level.
        query.get_learn_bits(user, [{_id: atopic._id}], function (err, tlbits) {
          if (err) {
            logger.error(err)
          }
          addData('learnbits', tlbits)
          logger.log('debug', 'Total learnbits for topic ' + topicname + ' is', (tlbits && tlbits.length) ? tlbits.length : 0)
          if (!noChildMode) {
            addData('noChildMode', false)
            query.get_first_childs(user, atopic.path, atopic.id, false, function (err, childs) {
              if (err) {
                console.error(err)
              }
              logger.log('debug', 'Total first childs for topic ' + topicname + ' is', (childs && childs.length) ? childs.length : 0)
              // console.log(childs)

              childs.forEach(function (c) {
                perms_lib.checkTopicViewAccess(user, c, function (err, res) {
                  if (!err && res) {
                    sid_id_map[c._id] = c.id
                  }
                })
              })
              // Added linkedTopics at the end
              childs = childs.concat(retMap['linkedTopics'] || [])
              addData('firstChilds', _.map(childs, function (ele) {
                formDiscussUrl(req, ele, user)
                return ele
              }))

              if (!childs || !childs.length) {
                childs = [atopic]
              }

              let child_lbits = {}
              let child_done = 0
              // Now for each child find all the sub-topic. Use that to find all the learnbits.
              childs.forEach(function (achild) {
                perms_lib.checkTopicViewAccess(user, achild, function (err, res) {
                  if (!err && res) {
                    // console.log(achild.path, achild.id)
                    query.get_sub_topics(user, achild.path, achild.id, false, function (err, subtopics) {
                      // logger.log('debug', achild.id, achild._id, subtopics.length)
                      if (!err && subtopics.length) {
                        subtopics.forEach(function (st) {
                          if (st) {
                            if (st.user_perms && st.user_perms[user._id] && _.indexOf(st.user_perms[user._id], constants.VIEW_PERMS) !== -1) {
                              sid_id_map[st._id] = st.id
                            } else {
                              perms_lib.checkTopicViewAccess(user, st, function (err, res) {
                                if (!err && res) {
                                  sid_id_map[st._id] = st.id
                                }
                              })
                            }
                          }
                        })
                        addData('sid_id_map', sid_id_map)
                      }

                      // Finally get some learn bits for the sub-topics
                      // Currently, gets the learnbits based on order. This needs to change to make it more personal.
                      query.get_few_learn_bits(user, achild, LIMIT_RECENT_BITS, function (err, lbits) {
                        if (err) {
                          console.error(err)
                        }
                        // logger.log('debug', "Recent learn bits for", achild.id, "is", (lbits && lbits.length) ? lbits.length : 0)
                        child_lbits[achild._id] = lbits
                        child_done++
                        // Only render after everything is done
                        if (child_done === childs.length) {
                          addData('sub_topics_lbits', child_lbits)
                          render(req, response)
                        }
                      })
                    })
                  } else {
                    if (achild) {
                      logger.log('debug', user._id, 'has no view access for the topic', achild.id, achild.path)
                    }
                    child_done++
                    // Only render after everything is done
                    if (child_done === childs.length) {
                      addData('sub_topics_lbits', child_lbits)
                      render(req, response)
                    }
                  }
                })
              })
            })
          } else {
            addData('firstChilds', [])
            addData('linkedTopics', [])
            addData('sid_id_map', {})
            addData('sub_topics_lbits', [])
            addData('noChildMode', true)
            render(req, response)
          }
        })
      } // doProcess
    )
  })
}

function save_map (req, response) {
  let user = req.user

  let _doneFn = function (sourceErr, rootTopic, topic) {
    if (sourceErr) {
      // logger.log('error', sourceErr)
      if (sourceErr === 'NO_PERMISSION') {
        response.send({
          status: 'error',
          message: sourceErr,
          topic: topic
        })
      }

      let category_map = util.parseJson(req.body.category_map)
      let rootTopicOid = req.body.rootTopic ? req.body.rootTopic._id : null
      let sessionid = req.body.sessionid
      let deletedOids = req.body.deletedOids
      let links = category_map.links || []
      // console.log(req.body.category_map)

      logger.log('debug', 'Topic json', req.body.category_map, 'rootTopicOid', rootTopicOid, 'deletedOids', deletedOids, 'sessionid', sessionid, 'links', links)
      let oid = category_map.oid
      if (util.empty(rootTopicOid) && oid) {
        rootTopicOid = oid
      } else {
        response.send({
          status: 'error',
          message: 'Error while saving this map. Please contact support.'
        })
      }
      return
    }
    if (!rootTopic) {
      rootTopic = topic
    }
    // console.log('rootTopic', rootTopic, sourceErr)
    let dbargs = {}
    if (rootTopic && rootTopic._id) {
      dbargs['_id'] = rootTopic._id
    } else {
      dbargs['id'] = rootTopic.id
      if (rootTopic.path) {
        dbargs['path'] = rootTopic.path
      }
      if (rootTopic.added_by) {
        dbargs['added_by'] = rootTopic.added_by
      }
    }

    // console.log("---", dbargs, rootTopic.id)
    let dataMap = {}
    send_topic_map(req, response, true, user, dbargs, dataMap, function (err, dataMap) {
      if (err) {
        logger.error(err)
      }
      response.send(dataMap)
      if (global.socket) {
        global.socket.emit('send:topic_tree', dataMap)
      } else {
        logger.log('warn', 'Unable to push the new topic tree to the clients')
      }
      req.query = {
        topic_id: dbargs['_id'] || dbargs['id'],
        e: 'save_map'
      }
      analytics.topic_track(req)
    })
  }

  let category_map = util.parseJson(req.body.category_map)
  let rootTopicOid = req.body.rootTopic ? req.body.rootTopic._id : null
  let rootTopic = null
  let sessionid = req.body.sessionid
  let deletedOids = req.body.deletedOids
  let links = category_map.links || []
  // console.log(req.body.category_map)

  logger.log('debug', 'Topic json', req.body.category_map, 'rootTopicOid', rootTopicOid, 'deletedOids', deletedOids, 'sessionid', sessionid, 'links', links)
  let title = category_map.title
  let oid = category_map.oid
  if (util.empty(rootTopicOid) && oid) {
    rootTopicOid = oid
  }

  // let topic_oid = req.body.topic_oid
  /*
  let isSelected = category_map.isSelected
  let selectedOid = null
  if (isSelected) {
    selectedOid = oid
  }
  */
  let id = util.idify(title)
  let targs = {}
  if (rootTopicOid) {
    targs = {_id: db.ObjectId(rootTopicOid)}
  } else {
    targs = {
      id: id
    }
    if (util.validOid(oid)) {
      targs = {
        _id: db.ObjectId(oid)
      }
    }
  }
  if (!title || title === 'Topic') {
    response.send({
      status: 'init',
      message: 'Create your topic map using this designer!'
    })
    return
  }

  // Handle delete topics
  if (deletedOids && deletedOids.length) {
    deletedOids.forEach(function (delMap) {
      if (util.validOid(delMap.oid)) {
        db.topics.findOne({_id: db.ObjectId(delMap.oid)}, function (err, topic) {
          if (!err && topic) {
            perms_lib.checkTopicDeleteAccess(user, topic, function (err, isAllowed) {
              if (!err && isAllowed) {
                query.delete_topic(user, topic._id, false, function (err) {
                  if (err) {
                    logger.error(err)
                  }
                  logger.log('debug', 'User', user._id, 'deleted the topic', topic.id, topic.path)
                })
              } else {
                logger.log('warn', 'User', user._id, 'has no permission to delete the topic', topic.id, topic.path)
              }
            })
          }
        })
      }
    })
  }

  // console.log(targs)
  query.get_topics(user, targs, false, function (err, topicList) {
    let topicObj = topicList.length ? topicList[0] : null
    // FIXME: Please revisit this restriction
    if (topicObj && topicObj.path === null && topicObj.user_perms && topicObj.user_perms[user._id] && _.indexOf(topicObj.user_perms[user._id], constants.EDIT_PERMS) === -1) {
      if (topicObj.id !== id) {
        response.send({
          status: 'error',
          message: 'Main topic name is already in use. Please choose a different one!'
        })
        return
      }
    }
    if (!topicObj) {
      topicObj = {
        id: id,
        added_by: user._id,
        privacy_mode: constants.PRIVATE,
        order: category_map.id
      }
      rootTopic = topicObj
    } else if (topicObj && rootTopicOid && '' + topicObj._id === rootTopicOid) {
      rootTopic = topicObj
    }

    user_lib.addUserPerms(user, topicObj, function () {
      let category_list = topicMapUtil.convertToList(category_map, topicObj.order)
      let done = 0

      function wrapper (rootTopic, category_list) {
        for (let index = 0; index < category_list.length; index++) {
          let ele = category_list[index]
          // console.log('ele is', ele)
          let order = (ele.order && parseInt(ele.order, 10) > 0) ? parseInt(ele.order, 10) : null
          try {
            let topic = wait.forMethod(query, 'update_topic', ele.name, ele.id, ele.oid, ele.path, order, false, user, ele.skipReorder, ele.link_in, ele.link_out)
            done++
            // Only render after completing the entire tree
            if (rootTopicOid && '' + topic._id === rootTopicOid) {
              rootTopic = topic
            }
            if ((!rootTopic || !rootTopic._id) && index === 0) {
              rootTopic = topic
            }

            if (done === category_list.length) {
              return _doneFn(err, rootTopic, topic)
            }
          } catch (err) {
            // console.error(err)
            logger.log('error', 'Error during update', err, ele.id, ele.path)
            return _doneFn(err, rootTopic, {_id: ele.oid, id: ele.id, name: ele.name, path: ele.path, order: order})
          }
        } // for
      }

      wait.launchFiber(wrapper, rootTopic, category_list)
    })
  })
}

function send_topic_map (req, response, isApi, user, dbargs, dataMap, callback) {
  dataMap['rootTopic'] = null
  let sessionid = (req.body && req.body.sessionid) ? req.body.sessionid : null
  query.get_topic_and_parents(user, dbargs, function (err, topicParentMap) {
    if (err) {
      console.error(err)
    }
    if (!topicParentMap || !topicParentMap['topic']) {
      dataMap['editOldEnabled'] = true
      dataMap['title'] = 'Topic Mapper'
      callback(err, dataMap)
      return
    }
    let tt = topicParentMap['topic']
    perms_lib.checkTopicViewAccess(user, tt, function (err, viewAllowed) {
      if (!err && !viewAllowed) {
        if (isApi) {
          response.send({
            status: 'error',
            message: "Looks like you don't have permission to view this topic. Please contact support!"
          })
        } else {
          logger.log('warn', 'User', user._id, "doesn't have view permission for topic", tt._id)
          response.render('error-500.ejs', {
            message: "Looks like you don't have permission to view this topic. Please contact support!"
          })
        }
      } else {
        let rootTopic = tt
        let parents = topicParentMap['parents']
        dataMap['topicObj'] = tt
        dataMap['editOldEnabled'] = true
        dataMap['category_map'] = "{title: '" + tt.name + "', oid:'" + tt._id + "', id: 1, formatVersion: 2}"
        let pathToUse = tt.path ? tt.path : ','
        pathToUse = pathToUse + tt.id + ','
        let orList = [{_id: db.ObjectId('' + tt._id)}, {path: new RegExp('^' + pathToUse)}]
        if (parents && parents.length) {
          parents.forEach(function (aparent) {
            if (aparent && aparent._id) {
              if (!rootTopic) {
                rootTopic = aparent
              }
              orList.push({_id: db.ObjectId('' + aparent._id)})
            }
          })
        }
        dataMap['rootTopic'] = (rootTopic && rootTopic._id) ? rootTopic._id : tt._id
        if (!rootTopic || !rootTopic._id) {
          dataMap['url'] = constants.MY_TOPICS_PAGE
        } else {
          dataMap['url'] = '/topic/' + tt._id + '/' + tt.id
        }
        // Do we have the permission to edit the rootTopic?
        perms_lib.checkTopicEditAccess(user, tt, function (err, editAllowed) {
          if (err) {
            logger.error(err)
          }
          dataMap['readOnly'] = !editAllowed
          dataMap['title'] = 'Topic map for ' + tt.name + (dataMap['readOnly'] ? ' in Read only mode' : '')
        })

        dbargs = {$or: orList, hidden: {$ne: true}}
        query.get_topics(user, dbargs, false, function (err, topics) {
          if (err || !topics) {
            if (isApi) {
              dataMap['category_map'] = []
              callback(err, dataMap)
            } else {
              let cljson = JSON.stringify([])
              dataMap['category_map'] = cljson
              callback(err, dataMap)
            }
          } else {
            // Filter the list based on view access
            let filteredList = []
            let done = 0
            topics.forEach(function (atopic) {
              perms_lib.allowedPerms(user, atopic, function (err, permsMap) {
                if (err) {
                  logger.error(err)
                }
                let permsList = permsMap[atopic._id]
                if (permsList && (_.indexOf(permsList, constants.EDIT_PERMS) !== -1 || _.indexOf(permsList, constants.VIEW_PERMS) !== -1)) {
                  filteredList.push(atopic)
                } else {
                  logger.log('info', 'Skipped topic', atopic.id, atopic.path, permsMap)
                }
                done++
                if (done === topics.length) {
                  query.convert_to_tree(filteredList, function (err, topicList) {
                    dataMap['status'] = (err || 'success')
                    dataMap['sessionid'] = sessionid
                    if (topicList && topicList.length) {
                      let ideasMap = topicMapUtil.convertToMap(topicList[0])
                      let cljson = JSON.stringify(ideasMap)
                      dataMap['hash'] = util.create_hash(cljson)
                      if (isApi) {
                        dataMap['category_map'] = ideasMap
                        callback(err, dataMap)
                      } else {
                        dataMap['category_map'] = cljson
                        callback(err, dataMap)
                      }
                    } else {
                      callback(err, dataMap)
                    }
                  })
                }
              })
            })
          }
        })
      }
    })
  })
}

function load_map (req, response, readOnly, pageView, isApi) {
  let user = req.user
  let topic = req.params['id']
  let topic_oid = req.params['oid'] || req.params['topic_oid'] || req.params['topic_id']
  let dataMap = {}
  dataMap['discussion_url'] = get_discuss_host(req)
  dataMap['pageView'] = pageView
  // dataMap['user'] = req.user
  // dataMap['readOnly'] = readOnly
  dataMap['newTopic'] = false
  dataMap['autoSave'] = false

  query.get_user_topics_count(user, function (err, count) {
    if (!err && !count) {
      dataMap['firstTime'] = true
    }
  })
  let dbargs = {}
  if (util.validOid(topic_oid)) {
    dbargs['_id'] = db.ObjectId(topic_oid)
  } else {
    dbargs = {path: null, id: topic}
  }

  send_topic_map(req, response, isApi, user, dbargs, dataMap, function (err, dataMap) {
    if (!err && isApi) {
      response.send(dataMap)
    } else {
      response.render('topic-mapper.ejs', dataMap)
    }
  })

  req.query = {
    topic_id: dbargs['_id'] || dbargs['id'],
    e: 'load_map'
  }
  analytics.topic_track(req)
}

function create_new_map (req, response) {
  let user = req.user
  let dataMap = {}
  let topicName = (req.query && req.query.name) ? req.query.name : 'New topic on ' + util.curr_date()

  query.create_topic(null, topicName, util.idify(topicName), 1, user._id, null, null, function (err, topic) {
    if (!err && topic && topic._id) {
      response.redirect('/topic/map/' + topic._id)
    } else {
      dataMap['discussion_url'] = get_discuss_host(req)
      dataMap['category_map'] = "{title: '" + topicName + "', id: 1, formatVersion: 2}"
      dataMap['editOldEnabled'] = true
      dataMap['rootTopic'] = null
      dataMap['pageView'] = true
      dataMap['newTopic'] = true
      dataMap['readOnly'] = false
      dataMap['autoSave'] = false
      dataMap['topicObj'] = topic
      dataMap['discuss_id'] = null
      dataMap['title'] = 'Create New Topic'
      // dataMap['user'] = req.user
      response.render('topic-mapper.ejs', dataMap)
    }
  })
}

function search (req, response, isApi) {
  let q = req.query.q
  let autoComplete = req.query.ac === '1'
  let user = req.user
  if (!q) {
    return response.json({})
  }
  es.findTopics({query: q, user: user, autoComplete: autoComplete}, constants.DEFAULT_SEARCH_PAGE_SIZE, function (err, data) {
    if (err) {
      logger.error('Error retrieving search results for topics', err)
      response.json({})
      return
    }
    response.json(data)
  })
}

function quicksearch (req, response) {
  let q = req.query.q
  let user = req.user
  let checkEditAccess = (req.query.filter_edit === '1')
  if (!q) {
    response.send('')
    return
  }
  q = new RegExp(q, 'i')
  db.topics.find({
    hidden: false, moderation_required: false, safe: true,
    $or: [{name: q}, {description: q}]
  }).limit(25, function (err, tmptopics) {
    if (err) {
      logger.error('Error retrieving search results for topic', err)
      response.send('')
      return
    }
    let topiclist = []
    let done = 0
    if (!tmptopics || !tmptopics.length) {
      let result = {
        more: false,
        results: topiclist
      }
      response.send(JSON.stringify(result))
      return
    }

    tmptopics.forEach(function (tt) {
      if (checkEditAccess) {
        perms_lib.checkTopicEditAccess(user, tt, function (err, res) {
          if (!err && res) {
            let displayPath = util.formatPath(tt.path)
            topiclist.push({
              id: tt._id,
              text: tt.name,
              path: displayPath
            })
          }
          done++
          if (done === tmptopics.length) {
            let result = {
              more: false,
              results: topiclist
            }
            response.send(JSON.stringify(result))
          }
        })
      } else {
        perms_lib.checkTopicViewAccess(user, tt, function (err, res) {
          if (!err && res) {
            let displayPath = util.formatPath(tt.path)
            topiclist.push({
              id: tt._id,
              text: tt.name,
              path: displayPath
            })
          }
          done++
          if (done === tmptopics.length) {
            let result = {
              more: false,
              results: topiclist
            }
            response.send(JSON.stringify(result))
          }
        })
      }
    })
  })
}

function list_user_topic (req, response) {
  let user = req.user
  let retMap = {}
  let sid_id_map = {}

  function addData (key, data) {
    if (key) {
      let d = {}
      d[key] = data
      // console.log(key, JSON.stringify(data))
      _.merge(retMap, d)
    }
  }

  let topicObj = {
    name: 'My topics',
    description: 'Personal collection of topics and content for ' + user.displayName,
    user_role: constants.TOPIC_ADMIN_ROLE,
    user_perms: []
  }
  addData('discussion_url', get_discuss_host(req))
  retMap['topicObj'] = topicObj
  retMap['learnbits'] = []
  retMap['virtual_learnbits'] = {}
  retMap['firstChilds'] = []
  retMap['sub_topics_lbits'] = []
  addData('sid_id_map', {})
  retMap['isMyTopicsPage'] = true

  query.get_user_topics(user, function (err, topicsMap) {
    if (err) {
      logger.log('error', 'Problem fetching user topics', err)
      response.render('topic.ejs', retMap)
      return
    }

    let topics = topicsMap['own_topics'] || []
    let collab_topics = topicsMap['collab_topics'] || []
    let colearnr_topics = topicsMap['colearnr_topics'] || []
    let followed_topics = topicsMap['followed_topics'] || []
    let search_topics = topicsMap['search_topics'] || []

    // Get the first level of collab and followed_topics alone
    topics = _.union(topics, collab_topics, colearnr_topics, followed_topics, search_topics)

    if (!topics.length) {
      logger.log('warn', 'There are no personal topics for the user', user._id)
      response.render('topic.ejs', retMap)
      return
    } else {
      logger.log('debug', 'User', user._id, 'has', topics.length, 'personal topics')
      let child_lbits = {}
      addData('firstChilds', _.map(topics, function (ele) {
        formDiscussUrl(req, ele, user)
        return ele
      }))
      if (!topics.length) {
        response.render('topic.ejs', retMap)
        return
      }
      query.get_virtual_learnbits(user, function (err, vlbits) {
        if (!err && vlbits) {
          addData('virtual_learnbits', vlbits)
        }
      })

      async.each(topics, function (achild, cb) {
        formDiscussUrl(req, achild, user)
        if (achild.type === 'search') {
          es.findLearnbits({query: achild.name, user: user}, LIMIT_RECENT_BITS, function (err, data) {
            if (!err && data && data.hits.hits) {
              let lbits = data.hits.hits.map(function (adata) {
                return adata._source
              })
              child_lbits[achild._id] = lbits
              addData('sub_topics_lbits', child_lbits)
            }
            cb()
          })
        } else {
          // Now for each topic find all the sub-topic. Use that to find all the learnbits.
          query.get_user_sub_topics(user, achild.path, achild.id, false, false, function (err, subtopics) {
            if (!err && subtopics.length) {
              subtopics.forEach(function (st) {
                formDiscussUrl(req, st, user)
                sid_id_map[st._id] = st.id
              })
              addData('sid_id_map', sid_id_map)
            }

            // Finally get all the learn bits for the sub-topics
            query.get_user_recent_learn_bits(user, achild, LIMIT_RECENT_BITS, function (err, lbits) {
              if (err) {
                console.error(err)
              }
              // console.log("Recent learn bits", achild, "is", (lbits && lbits.length) ? lbits.length : 0)
              child_lbits[achild._id] = lbits
              addData('sub_topics_lbits', child_lbits)
              cb()
            })
          })
        }
      }, function (err) {
        if (err) {
          logger.error(err)
        }
        response.render('topic.ejs', retMap)
      })
    }
  })
}

function edit_form (req, res) {
  let oid = req.params['oid']
  let user = req.user
  if (!util.validOid(oid)) {
    res.status(500).send('Invalid topic id!')
    return
  }
  query.get_topic(user, {_id: db.ObjectId(oid)}, function (err, topic) {
    if (err) {
      res.status(500).send('Unable to load the topic. Please try after sometime.')
      return
    }
    if (!topic) {
      res.status(500).send('Invalid topic id!')
      return
    }
    perms_lib.checkTopicEditAccess(user, topic, function (err, result) {
      if (!err && !result) {
        res.render('error-500.ejs', {
          message: "Looks like you don't have permission to edit this topic. Please contact support!"
        })
        return
      } else {
        // Fix for negative order
        if (topic.order && topic.order < 0) {
          topic.order = null
        }
        let tags = topic.tags
        let collaborators = topic.collaborators || []
        let colearnrs = topic.colearnrs || []
        let usersToLookup = []
        usersToLookup = usersToLookup.concat(collaborators).concat(colearnrs)
        Step(
          function fetchLinkedOutTopics () {
            let self = this
            if (!util.empty(topic.link_out)) {
              let args = util.convert_links(topic.link_out)
              if (!util.empty(args)) {
                query.get_topics(user, args, false, function (err, tmptopiclist) {
                  let topiclist = []
                  if (err) {
                    logger.log('error', 'Error retrieving topiclist', err)
                  }
                  if (tmptopiclist) {
                    tmptopiclist.forEach(function (at) {
                      topiclist.push({id: at._id, text: at.name})
                    })
                  }
                  topic.link_out_topics = util.stringify(topiclist)
                  self(null, null)
                })
              } else {
                self(null, null)
              }
            } else {
              self(null, null)
            }
          },
          function fetchLinkedInTopics (err) {
            if (err) {
              logger.log('error', 'Error retrieving topiclist', err)
            }
            let self = this
            if (!util.empty(topic.link_in)) {
              let args = util.convert_links(topic.link_in)
              if (!util.empty(args)) {
                query.get_topics(user, args, false, function (err, tmptopiclist) {
                  let topiclist = []
                  if (err) {
                    logger.log('error', 'Error retrieving topiclist', err)
                  }
                  if (tmptopiclist) {
                    tmptopiclist.forEach(function (at) {
                      topiclist.push({id: at._id, text: at.name})
                    })
                  }
                  topic.link_in_topics = util.stringify(topiclist)
                  self(null, null)
                })
              } else {
                self(null, null)
              }
            } else {
              self(null, null)
            }
          },
          function fetchUsers (err) {
            if (err) {
              logger.error(err)
            }
            if (usersToLookup && usersToLookup.length) {
              let collaboratorList = []
              let colearnrList = []
              let tmpMap = {}
              db.users.find({$or: [{_id: {$in: usersToLookup}}, {emails: {$in: usersToLookup}}]}, function (err, users) {
                if (err) {
                  logger.error(err)
                }
                if (users) {
                  users.forEach(function (auser) {
                    tmpMap[auser._id] = auser
                    auser.emails.forEach(function (ae) {
                      tmpMap[ae] = auser
                    })
                  })
                }
                collaborators.forEach(function (acol) {
                  if (tmpMap[acol]) {
                    collaboratorList.push({id: tmpMap[acol]._id, text: tmpMap[acol].emails[0]})
                  } else { // Handles case where the collaborator has not signed up yet.
                    collaboratorList.push({id: acol, text: acol})
                  }
                })
                colearnrs.forEach(function (acol) {
                  if (_.indexOf(collaborators, acol) === -1) { // Do not include any collaborators
                    if (tmpMap[acol]) {
                      colearnrList.push({id: tmpMap[acol]._id, text: tmpMap[acol].emails[0]})
                    } else { // Handles case where the collaborator has not signed up yet.
                      colearnrList.push({id: acol, text: acol})
                    }
                  }
                })
                res.render('topic-form.ejs', {
                  topic: topic,
                  error: null,
                  collaborators: collaboratorList.length ? collaboratorList : null,
                  colearnrs: colearnrList.length ? colearnrList : null,
                  taglist: tags ? '[' + JSON.stringify(tags) + ']' : '[]'
                })
              })
            } else {
              res.render('topic-form.ejs', {
                topic: topic,
                error: null,
                collaborators: null,
                colearnrs: null,
                taglist: tags ? '[' + JSON.stringify(tags) + ']' : '[]'
              })
            }
          }
        )
        req.query = {topic_id: topic._id, e: 'edit_topic'}
        analytics.topic_track(req)
      }
    })
  })
}

function delete_topic (req, res, reallyDelete) {
  let oid = req.params['oid']
  let user = req.user
  if (!util.validOid(oid)) {
    res.status(500).send('Invalid topic id!')
    return
  }
  query.get_topic_and_parents(user, {_id: db.ObjectId(oid)}, function (err, topicParentMap) {
    if (err) {
      res.status(500).send('Unable to load the topic. Please try after sometime.')
      return
    }
    let topic = topicParentMap['topic']
    let parents = topicParentMap['parents']
    if (!topic) {
      res.status(500).send('Invalid topic id!')
      return
    }
    if (topic.hidden && !reallyDelete) {
      res.status(500).send('This topic is already deleted!')
      return
    }
    perms_lib.checkTopicDeleteAccess(user, topic, function (err, result) {
      if (err) {
        logger.error(err)
      }
      let redirectUrl = constants.MY_TOPICS_PAGE
      if (!result) {
        res.render('error-500.ejs', {
          message: "Looks like you don't have permission to delete this topic. Please contact support!"
        })
        return
      } else if (topic.type === 'search' || (topic.is_expanded && topic.expanded_for === oid)) { // Just a link remove it
        db.topics.remove({_id: db.ObjectId(oid)})
        if (req.xhr) {
          let data = {
            redirectUrl: redirectUrl
          }
          res.send(data)
        } else {
          res.redirect(redirectUrl)
        }
        req.query = {topic_id: topic._id, e: reallyDelete ? 'fulldelete' : 'delete'}
        analytics.topic_track(req)
      } else {
        redirectUrl = '/topic/' + topic._id + '/' + topic.id
        query.is_topic_empty(user, topic, function (err, isEmpty) {
          if (err) {
            logger.error(err)
          }
          if (isEmpty) {
            reallyDelete = true
          }
          if (reallyDelete) {
            if (parents && parents.length && parents[parents.length - 1]) {
              let immParent = parents[parents.length - 1]
              if (immParent._id) {
                redirectUrl = '/topic/' + immParent._id
              } else {
                redirectUrl = constants.MY_TOPICS_PAGE
              }
            } else {
              redirectUrl = constants.MY_TOPICS_PAGE
            }
          }
          query.delete_topic(user, oid, reallyDelete, function (err) {
            if (err) {
              logger.log('error', 'Problem deleting topic', oid, err)
            }
          })
          if (req.xhr) {
            let data = {
              redirectUrl: redirectUrl
            }
            res.send(data)
          } else {
            res.redirect(redirectUrl)
          }
          req.query = {topic_id: topic._id, e: reallyDelete ? 'fulldelete' : 'delete'}
          analytics.topic_track(req)
        })
      }
    })
  })
}

function undelete_topic (req, res) {
  let oid = req.params['oid']
  let user = req.user
  if (!util.validOid(oid)) {
    res.status(500).send('Invalid topic id!')
    return
  }
  query.get_topic(user, {_id: db.ObjectId(oid)}, function (err, topic) {
    if (err) {
      res.status(500).send('Unable to load the topic. Please try after sometime.')
      return
    }
    if (!topic) {
      res.status(500).send('Invalid topic id!')
      return
    }
    if (!topic.hidden) {
      res.status(500).send('This topic is not deleted yet!')
      return
    }
    perms_lib.checkTopicDeleteAccess(user, topic, function (err, result) {
      if (err) {
        logger.error(err)
      }
      if (!result) {
        res.render('error-500.ejs', {
          message: "Looks like you don't have permission to restore this topic. Please contact support!"
        })
        return
      } else {
        query.undelete_topic(user, oid, function (err) {
          if (err) {
            logger.log('error', 'Problem undeleting topic', oid, err)
          }
        })
        let redirectUrl = '/topic/' + topic._id + '/' + topic.id
        if (req.xhr) {
          let data = {
            redirectUrl: redirectUrl
          }
          res.send(data)
        } else {
          res.redirect(redirectUrl)
        }
        req.query = {topic_id: topic._id, e: 'restore'}
        analytics.topic_track(req)
      }
    })
  })
}

function save_edit (req, res) {
  let user = req.user
  let newValue = req.body.update_value
  let tid = req.body.element_id
  let oldValue = req.body.original_html
  let idlist = tid.split('-')
  let id = null
  let type = null
  if (idlist && idlist.length > 1) {
    id = idlist[1]
    type = idlist[2]
  }
  if (!id) {
    res.status(500).send('No such id found!')
    return
  }
  /*
  if (type === 'name' && util.hasInvalidSymbol(newValue)) {
    res.status(500).send("Topic names can only have the following symbols [+,.#-_().]")
    return
  }
  */
  query.get_topic(user, {_id: db.ObjectId(id)}, function (err, topic) {
    if (err) {
      res.status(500).send('Unable to load the topic. Please try after sometime.')
      return
    }
    if (!topic) {
      res.status(500).send('Invalid topic id!')
      return
    }

    perms_lib.checkTopicEditAccess(user, topic, function (err, result) {
      if (err) {
        logger.error(err)
      }
      if (!result) {
        res.status(500).send('Looks like you do not have this permission.')
        return
      } else {
        query.update_topic_quick(id, oldValue, newValue, type, function (err) {
          if (err) {
            res.status(500).send('Error while saving!')
          } else {
            res.status(200).send(newValue)
          }
        })
      }
    })
  })
}

// WEB-957 fix - Do not allow edit to existing topic
function checkExistingRootTopic (idChange, newId, topic, user, callback) {
  if (!idChange || !newId || topic.path !== null) {
    callback(null, true)
    return
  }
  db.topics.findOne({id: newId, path: null}, function (err, exisTopic) {
    callback(err, !exisTopic)
  })
}

function save_edit_full (req, res) {
  let user = req.user
  let idChange = false
  let oldId = null
  let update_map = {
    'last_updated': new Date()
  }
  update_map['modified_by'] = req.user._id
  let oid = req.body.oid
  let errorStr = ''
  if (!util.validOid(oid)) {
    errorStr = 'Unable to find the original topic for editing!'
    res.status(500).send(errorStr)
    return
  }

  if (util.empty(req.body.name)) {
    errorStr = 'Name is mandatory for a topic!'
    res.status(500).send(errorStr)
    return
  }
  /*
  if (util.hasInvalidSymbol(req.body.name)) {
    res.status(500).send("Topic names can only have the following symbols [+,.#-_().]")
    return
  }
  */
  update_map['name'] = req.body.name || ''
  update_map['id'] = util.idify(req.body.name)
  update_map['description'] = req.body.description || ''
  update_map['body'] = req.body.body || ''
  update_map['order'] = req.body.order ? parseInt(req.body.order) : null
  update_map['draft_mode'] = (req.body.draft_mode === 'true')
  update_map['startdate'] = req.body.startdate || null
  update_map['enddate'] = req.body.enddate || null
  update_map['discuss_anchor'] = req.body.discuss_anchor || null
  update_map['discuss_anchor_url'] = req.body.discuss_anchor_url || null

  if (req.body['img_url']) {
    update_map['img_url'] = util.parseJson(req.body['img_url'])
  } else {
    update_map['img_url'] = null
  }
  if (req.body.tags) {
    update_map['tags'] = req.body.tags
  } else {
    update_map['tags'] = []
  }
  if (req.body.privacy_mode && req.body.privacy_mode === 'public') {
    update_map['privacy_mode'] = 'public'
  } else {
    update_map['privacy_mode'] = 'private'
  }

  let link_out = []
  if (req.body.link_out) {
    req.body.link_out.split(',').forEach(function (alink) {
      link_out.push({_id: alink})
    })
  }

  let link_in = []
  if (req.body.link_in) {
    req.body.link_in.split(',').forEach(function (alink) {
      link_in.push({_id: alink})
    })
  }

  function _convertEmail (topic, whom, callback) {
    if (req.body[whom]) {
      let ownerEmails = []
      let cemails = req.body[whom].split(',')
      db.users.find({emails: {$in: cemails}}, function (err, users) {
        let clist = []
        let email_id_map = {}
        if (!err && users.length) {
          users.forEach(function (auser) {
            // Do not include the owner as a collaborator
            if (auser.emails && auser._id !== topic.added_by) {
              auser.emails.forEach(function (ae) {
                email_id_map[ae] = auser._id
              })
            }
            if (auser._id === topic.added_by) {
              ownerEmails = auser.emails || []
            }
          })
        }
        cemails.forEach(function (aemail) {
          aemail = aemail.toLowerCase()
          // Do not include the owner
          if (_.indexOf(ownerEmails, aemail) === -1) {
            if (!email_id_map[aemail]) {
              let id = util.create_hash(aemail)
              email_id_map[aemail] = id
            }
            clist.push(email_id_map[aemail])
            if (whom === 'collaborators') {
              user_lib.invite_collaborator({_id: email_id_map[aemail], email: aemail}, req.user, topic)
            } else if (whom === 'colearnrs') {
              user_lib.invite_colearnr({_id: email_id_map[aemail], email: aemail}, req.user, topic)
            }
          }
        })
        update_map[whom] = clist
        callback(update_map)
      })
    } else {
      update_map[whom] = null
      callback(update_map)
    }
  }

  query.get_topic(user, {_id: db.ObjectId(oid)}, function (err, topic) {
    if (err) {
      res.status(500).send('Unable to load the topic. Please try after sometime.')
      return
    }
    if (!topic) {
      res.status(500).send('Invalid topic id!')
      return
    }

    perms_lib.checkTopicEditAccess(user, topic, function (err, result) {
      if (err || !result) {
        res.status(500).send('Looks like you are not the topic admin. Please contact support!')
        return
      } else {
        // WEB-862, WEB-863 fix
        if (topic.id !== update_map['id']) {
          idChange = true
          oldId = topic.id
        }
        checkExistingRootTopic(idChange, update_map.id, topic, user, function (err, isAllowed) {
          if (err || !isAllowed) {
            res.status(500).send('Topic already exists with the new name ' + req.body.name)
            return
          }
          _convertEmail(topic, 'collaborators', function (update_map) {
            _convertEmail(topic, 'colearnrs', function (update_map) {
              // logger.log('debug', 'Updating topic', update_map, user._id, topic.user_role)
              let prevCollaborators = topic.collaborators || []
              let newCollaborators = update_map['collaborators'] || []
              let prevCoLearnrs = topic.colearnrs || []
              let newTmpCoLearnrs = update_map['colearnrs'] || []
              let newCoLearnrs = []
              // Filter colearnrs who are also collaborators
              newTmpCoLearnrs.forEach(function (ncol) {
                if (_.indexOf(newCollaborators, ncol) === -1) {
                  newCoLearnrs.push(ncol)
                }
              })
              let topicsToTouch = [topic]
              db.topics.findAndModify({
                query: {_id: db.ObjectId(oid)},
                update: {$set: update_map},
                new: true
              }, function (err, utopic) {
                if (err || !utopic) {
                  res.status(500).send('Error while updating topic. Please try again later.')
                } else {
                  res.send('' + utopic._id)
                }
              })

              // Fix the links
              if (!_.isEqual(topic.link_out, link_out)) {
                query.remove_all_links(user, topic, function (err) {
                  if (!err && !util.empty(link_out)) {
                    link_out.forEach(function (alink) {
                      query.add_linked_topic(user, topic, alink, function () {})
                    })
                  }
                })
              }

              // Get all the sub-topics and update permissions
              query.get_sub_topics(null, topic.path, topic.id, false, function (err, stopics) {
                if (!err && stopics.length) {
                  topicsToTouch = _.union(topicsToTouch, stopics)
                }
                topicsToTouch.forEach(function (at) {
                  // Remove the permission for old collaborators and permission new ones.
                  if (prevCollaborators.length) {
                    prevCollaborators.forEach(function (acollab) {
                      // logger.log('debug', 'Removing collaborator access for ', acollab, at.id)
                      perms_lib.removeTopicCollabPerms({_id: acollab}, at, function (err) {
                        if (err) {
                          logger.log('warn', 'Unable to remove collaborator access for', acollab, 'from topic', at.id)
                        }
                      })
                    })
                  }

                  if (newCollaborators.length) {
                    newCollaborators.forEach(function (acollab) {
                      // logger.log('debug', 'Adding collaborator access for ', acollab, at.id)
                      perms_lib.addTopicCollabPerms({_id: acollab}, at, function (err) {
                        if (err) {
                          logger.log('warn', 'Unable to add collaborator access for', acollab, 'from topic', at.id)
                        }
                      })
                    })
                  }

                  // Remove the permission for old colearnrs and permission new ones.
                  if (prevCoLearnrs.length) {
                    prevCoLearnrs.forEach(function (acolearnr) {
                      // logger.log('debug', 'Removing colearnr access for ', acolearnr, at.id)
                      perms_lib.removeTopicCoLearnrPerms({_id: acolearnr}, at, function (err) {
                        if (err) {
                          logger.log('warn', 'Unable to remove collaborator access for', acolearnr, 'from topic', at.id)
                        }
                      })
                    })
                  }

                  if (newCoLearnrs.length) {
                    newCoLearnrs.forEach(function (acolearnr) {
                      // logger.log('debug', 'Adding colearnr access for ', acolearnr, at.id)
                      perms_lib.addTopicCoLearnrPerms({_id: acolearnr}, at, function (err) {
                        if (err) {
                          logger.log('warn', 'Unable to add colearnr access for', acolearnr, 'from topic', at.id)
                        }
                      })
                    })
                  }
                  let newPath = at.path
                  if (idChange && ('' + topic._id !== '' + at._id)) {
                    newPath = at.path.replace(oldId, update_map['id'])
                    logger.log('debug', 'changed path', at.path, newPath)
                  }
                  db.topics.update({_id: at._id}, {
                    $set: {
                      path: newPath,
                      last_updated: new Date(),
                      modified_by: user._id,
                      colearnrs: newCoLearnrs,
                      collaborators: newCollaborators,
                      privacy_mode: update_map.privacy_mode,
                      draft_mode: update_map.draft_mode,
                      startdate: update_map.startdate,
                      enddate: update_map.enddate,
                      discuss_anchor: update_map.discuss_anchor,
                      discuss_anchor_url: update_map.discuss_anchor_url
                    }
                  })
                })
              })
            }) // handle colearnrs list
          }) // handle collaborators list
        })
      }
    })
  })
}

function generate_learn_map (req, res) {
  let user = req.user
  let retMap = {}
  retMap['title'] = 'Learn map for ' + user.displayName

  res.render('learnings-map.ejs', retMap)
}

function follow (req, res) {
  let user = req.user
  let oid = req.params['topic_oid'] || req.params['topic_id']
  if (util.empty(oid)) {
    res.status(500).send('No topic specified!')
    return
  }
  logger.log('debug', 'Follow topic', oid, user._id)
  query.get_topic(user, {_id: db.ObjectId(oid)}, function (err, topic) {
    if (err) {
      logger.log('error', 'Problem loading topic', oid, err)
      res.status(500).send('Unable to load the topic. Please try after sometime.')
      return
    }
    if (!topic) {
      res.status(500).send('Invalid topic id!')
      return
    }
    perms_lib.checkTopicViewAccess(user, topic, function (err, result) {
      if (err || !result) {
        res.status(500).send("Looks like you don't have permission to follow this topic. Please contact support!")
        return
      } else {
        if (util.empty(topic.followers)) {
          db.topics.update({_id: db.ObjectId(oid)}, {
            $push: {followers: user._id}
          })
          res.send({
            message: 'You are the first follower for this topic! Please help spread the word!',
            type: 'follow'
          })
          return
        } else if (_.indexOf(topic.followers, user._id) !== -1) {
          db.topics.update({_id: db.ObjectId(oid)}, {
            $pull: {followers: user._id}
          })
          res.send({
            message: 'You have stopped following this topic!',
            type: 'unfollow'
          })
          return
        } else {
          db.topics.update({_id: db.ObjectId(oid)}, {
            $push: {
              followers: user._id
            }
          })
          res.send({
            message: 'You are now following this topic!',
            type: 'follow'
          })
          return
        }
      }
    })
  })
}

function list_users (req, res) {
  let topic_oid = req.params['topic_oid'] || req.params['topic_id']
  let user = req.user
  if (!topic_oid) {
    res.status(500).send('Invalid topic id')
    return
  }
  query.get_topic(user, {_id: db.ObjectId(topic_oid)}, function (err, topicObj) {
    if (!err && topicObj) {
      query.expandUsers(topicObj, function (err, etopicObj) {
        if (err) {
          logger.error(err)
        }
        // res.send(JSON.stringify(etopicObj))
        res.render('./topic/user_list.ejs', {topicObj: etopicObj, user: user})
      })
    } else {
      res.status(500).send('Invalid topic id')
    }
  })
}

function save_users (req, res) {
  let topic_oid = req.params['topic_oid'] || req.params['topic_id']
  let user = req.user
  if (!topic_oid) {
    res.status(500).send('Invalid topic id')
    return
  }
  let added_collab = req.body.added_collab
  let removed_collab = req.body.removed_collab
  let new_users = req.body.new_users
  if (added_collab) {
    added_collab = _.keys(added_collab)
  }
  if (removed_collab) {
    removed_collab = _.keys(removed_collab)
  }
  if (new_users) {
    new_users = new_users.split(',')
  }
  if (!added_collab && !removed_collab && !new_users) {
    res.send('0')
    return
  }
  // console.log(added_collab, removed_collab, new_users)
  query.get_topic(user, {_id: db.ObjectId(topic_oid)}, function (err, topicObj) {
    if (!err && topicObj) {
      perms_lib.checkTopicEditAccess(user, topicObj, function (err, result) {
        if (err || !result) {
          res.status(500).send('Looks like you are not the topic admin. Please contact support!')
          return
        } else {
          let curr_collaborators = topicObj.collaborators || []
          if (curr_collaborators) {
            if (removed_collab && removed_collab.length) {
              removed_collab.forEach(function (rcollab) {
                curr_collaborators = _.without(curr_collaborators, rcollab)
              })
            }

            if (added_collab && added_collab.length) {
              added_collab.forEach(function (acollab) {
                curr_collaborators.push(acollab)
              })
            }
          }
          if (new_users && new_users.length) {
            new_users.forEach(function (nuser) {
              let id = util.create_hash(nuser)
              user_lib.invite_collaborator({_id: id, email: nuser}, req.user, topicObj)
              curr_collaborators.push(id)
            })
          }
          // console.log('New collab list', curr_collaborators)
          db.topics.findAndModify({
            query: {_id: db.ObjectId('' + topicObj._id)},
            update: {$set: {collaborators: curr_collaborators, last_updated: new Date(), modified_by: req.user._id}}
          }, function (err, utopic) {
            if (err || !utopic) {
              res.status(500).send('Error while updating topic. Please try again later.')
            } else {
              res.send('' + utopic._id)
            }
          })

          // Get all the sub-topics and update permissions
          query.get_sub_topics(null, topicObj.path, topicObj.id, false, function (err, stopics) {
            if (!err && stopics.length) {
              stopics.forEach(function (at) {
                let prevCollaborators = at.collaborators || []
                let newCollaborators = curr_collaborators || []

                // Remove the permission for old collaborators and permission new ones.
                if (prevCollaborators.length) {
                  prevCollaborators.forEach(function (acollab) {
                    logger.log('debug', 'Removing collaborator access for ', acollab, at.id)
                    perms_lib.removeTopicCollabPerms({_id: acollab}, at, function (err) {
                      if (err) {
                        logger.log('warn', 'Unable to remove collaborator access for', acollab, 'from topic', at.id)
                      }
                    })
                  })
                }

                if (newCollaborators.length) {
                  newCollaborators.forEach(function (acollab) {
                    logger.log('debug', 'Adding collaborator access for ', acollab, at.id)
                    perms_lib.addTopicCollabPerms({_id: acollab}, at, function (err) {
                      if (err) {
                        logger.log('warn', 'Unable to add collaborator access for', acollab, 'from topic', at.id)
                      }
                    })
                  })
                }

                db.topics.update({_id: at._id}, {
                  $set: {
                    last_updated: new Date(),
                    modified_by: user._id,
                    collaborators: newCollaborators
                  }
                })
              })
            }
          })
        }
      }) // check edit
    } else {
      res.status(500).send('Invalid topic id')
    }
  })
}

function media_upload (req, res) {
  let fstream
  // let sessionid = req.headers['cl-sessionid']
  let oid = req.params.oid
  let user = req.user
  let userPath = path.join(config.upload_base_dir, user._id, 'media')
  if (util.validOid(oid)) {
    query.get_topic(user, {_id: db.ObjectId(oid)}, function (err, topicObj) {
      if (err || !topicObj) {
        res.status(500).send('Unable to add media to topic. Please try after some time.')
        logger.log('error', 'Invalid topic', err, oid)
        return
      } else {
        req.pipe(req.busboy)
        fse.ensureDirSync(userPath)
        req.busboy.on('file', function (fieldname, file, filename) {
          let fullPath = userPath + '/' + filename
          logger.log('info', 'Receiving: ' + filename + ' from user ' + user._id, 'for topic', topicObj._id)
          fstream = fs.createWriteStream(fullPath)
          file.pipe(fstream)
          fstream.on('close', function () {
            // let clUrl = constants.CL_PROTOCOL + user._id + '/' + encodeURIComponent(filename)
            logger.debug(filename, 'uploaded successfully to', userPath)
            // Add to GridFS
            GridFS.storeFile(fullPath, {lbit_id: null, added_by: topicObj.added_by, topic_id: topicObj._id}, function (err, fileObj) {
              if (err) {
                logger.error(err)
              }
              logger.info('Stored file ' + filename + ' in grid as ' + fileObj._id)
              res.json({file: fileObj})
            })
          })
        })
      }
    })
  }
}

exports.get_topic = get_topic

exports.list_category = function (req, response) {
  process(req, response)
}

exports.list = function (req, response) {
  process(req, response)
}

exports.list_by_oid = function (req, response) {
  process(req, response)
}

exports.save_map = function (req, response) {
  save_map(req, response)
}

exports.load_map = function (req, response) {
  load_map(req, response, false, true, false)
}

exports.load_map_api = function (req, response) {
  load_map(req, response, false, true, true)
}

exports.load_ro_map = function (req, response) {
  load_map(req, response, true, true)
}

exports.create_new = function (req, response) {
  create_new_map(req, response)
}

exports.search = function (req, response) {
  search(req, response, false)
}
exports.quicksearch = quicksearch
exports.search_api = function (req, response) {
  search(req, response, true)
}

exports.list_user_topic = function (req, response) {
  list_user_topic(req, response)
}

exports.edit_form = function (req, res) {
  edit_form(req, res)
}

exports.delete_topic = function (req, res) {
  delete_topic(req, res, false)
}

exports.delete_topic_full = function (req, res) {
  delete_topic(req, res, true)
}

exports.undelete_topic = function (req, res) {
  undelete_topic(req, res)
}

exports.save_edit = function (req, res) {
  save_edit(req, res)
}

exports.save_edit_full = function (req, res) {
  save_edit_full(req, res)
}

exports.list_users = function (req, res) {
  list_users(req, res)
}

exports.save_users = function (req, res) {
  save_users(req, res)
}

exports.generate_learn_map = generate_learn_map
exports.formDiscussUrl = formDiscussUrl
exports.follow = follow
exports.list_users = list_users
exports.save_users = save_users
exports.media_upload = media_upload
