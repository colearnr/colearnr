'use strict'

const db = require('./db')
const _ = require('lodash')
const RDB = require('./redis')
const logger = require('./log')
const constants = require('./constants')
const cloud_lib = require('../lib/cloud')
const Step = require('step')
const perms = require('../lib/perms')
const async = require('async')
const util = require('./util')

const query = {
  _checkDeleteAccess: function (obj, user) {
    if (!obj.hidden || (obj.hidden && (obj.added_by === user._id || (obj.user_role && obj.user_role[user._id] && (obj.user_role[user._id] === constants.TOPIC_ADMIN_ROLE || obj.user_role[user._id] === constants.ADMIN_ROLE))))) {
      return true
    } else {
      return false
    }
  },

  _handleSmartTopics: function (user, topic, callback) {
    let self = this
    if (topic && topic.smart && topic.linked_topics && topic.linked_topics.length) {
      logger.log('warn', 'Linked topic feature is getting deprecated', topic.id, topic.path)
      let args = {}
      let etopiclist = []
      topic.linked_topics.forEach(function (atopic_id) {
        etopiclist.push(db.ObjectId('' + atopic_id))
      })
      let tmpA = {}
      tmpA['$in'] = etopiclist
      args['_id'] = tmpA
      // console.log('debug', 'Handle smart topics with args', args)
      self.get_topics(user, args, false, callback)
    } else {
      callback(null, [topic])
    }
  },

  getViewCount: function (lbitId, topicId, userId, e, callback) {
    e = e || 'view'
    if (!lbitId && !topicId && !userId) {
      callback(null, null)
    } else {
      let args = {}
      // Fetch learnbit views
      if (lbitId) {
        args = {lbit_id: '' + lbitId, e: e, type: 'lbit'}
        if (topicId) {
          args['topic_id'] = topicId
        }
        if (userId) {
          args['user'] = userId
        }
        return db.analytics.count(args, callback)
      }
      // Fetch just topic views
      if (!lbitId && topicId) {
        args = {topic_id: topicId, e: e, type: 'topic'}
        if (userId) {
          args['user'] = userId
        }
        return db.analytics.count(args, callback)
      }
      return callback(null, null)
    }
  },

  getCommentCount: function (objid, callback) {
    let tid = null
    let count = null
    if (!objid) {
      callback(null, tid, count)
    } else {
      RDB.get('topic:objid:' + objid + ':tid', function (err, tid) {
        if (err || !tid) {
          callback(err, tid, count)
        } else {
          RDB.hget('topic:' + tid, 'postcount', function (err, count) {
            if (count > 1000) {
              count = '1k'
            }
            callback(err, tid, count > 0 ? count - 1 : 0)
          })
        }
      })
    }
  },

  getIdForTopic: function (topic, callback) {
    // console.log(topic)
    let args = "getIdForTopic('" + topic + "')"
    db.eval(args, callback)
  },

  getIdForTopicPath: function (path, topic, callback) {
    // console.log(path, topic)
    if (!path) {
      path = ''
    }
    let args = "getIdForTopicPath('" + path + "', '" + topic + "')"
    db.eval(args, callback)
  },

  getIdForTopics: function (topics, callback) {
    // console.log(topics)
    let args = "getIdForTopics('" + util.stringify(topics) + "')"
    db.eval(args, callback)
  },

  _streamUrlCheck: function (lbit, callback) {
    if (util.isStreamUrl(lbit.url)) {
      let surl = cloud_lib.getSignedUrl(lbit.url, null)
      if (surl) {
        lbit.url = surl
      }
    }
    callback(null, lbit)
  },

  setLearnbitMetadata: function (user, topics, lbits, callback) {
    let count = lbits.length
    let done = 0
    let self = this
    let topicPerms = {}
    let userIdCache = {}

    function _setCommentCount (self, lbit, cb) {
      // console.log(lbit.title, lbit.user_perms)
      // Set the comment count
      self.getCommentCount(lbit._id, function (err, tid, comments_count) {
        if (err) {
          return cb(err)
        }
        lbit.discuss_topic_id = tid
        lbit.comments_count = comments_count
        if (lbit.added_by !== 'colearnr') {
          if (userIdCache[lbit.added_by]) {
            lbit.userObj = userIdCache[lbit.added_by]
            done++
            if (done === count) {
              cb(null, lbits)
            }
          } else {
            db.users.findOne({_id: lbit.added_by}, {displayName: 1, profileImage: 1}, function (err, userObj) {
              if (!err && userObj) {
                userObj.slug = util.idify(userObj.displayName)
                userIdCache[lbit.added_by] = userObj
                lbit.userObj = userObj
              }
              done++
              if (done === count) {
                cb(null, lbits)
              }
            })
          }
        } else {
          done++
          if (done === count) {
            cb(null, lbits)
          }
        }
      })
    }

    topics.forEach(function (atopic) {
      if (atopic && atopic.user_perms) {
        topicPerms[atopic._id] = atopic.user_perms
      }
    })

    lbits.forEach(function (lbit) {
      // Set the user permissions
      if (!lbit.user_perms) {
        let uid = user ? user._id : null
        lbit.user_perms = {}
        lbit.user_perms[uid] = []
        lbit.topics.forEach(function (at) {
          if (topicPerms[at._id]) {
            _.merge(lbit.user_perms[user._id], topicPerms[at._id])
            _setCommentCount(self, lbit, callback)
          } else {
            self.get_topic(user, {_id: at._id}, function (err, ft) {
              if (err) {
                return callback(err)
              }
              if (ft && ft.user_perms) {
                _.merge(lbit.user_perms[uid], ft.user_perms)
              }
              _setCommentCount(self, lbit, callback)
            })
          }
        })
      } else {
        _setCommentCount(self, lbit, callback)
      }
    })
  },

  get_learnbit: function (user, args, callback) {
    let self = this
    db.learnbits.findOne(args, function (err, lbit) {
      if (err || !lbit) {
        callback(err, lbit)
      } else {
        self.getCommentCount(lbit._id, function (err, tid, comments_count) {
          lbit.discuss_topic_id = tid
          lbit.comments_count = comments_count
          if (util.isStreamUrl(lbit.url)) {
            let surl = cloud_lib.getSignedUrl(lbit.url, null)
            if (surl) {
              lbit.url = surl
            }
          }
          callback(err, lbit)
        })
      }
    })
  },

  get_topic: function (user, args, callback) {
    // args['hidden'] = {$ne: true}
    let self = this
    let uid = user._id
    db.topics.findOne(args, function (err, atopic) {
      if (err || !atopic || !user) {
        callback(err, atopic)
        return
      }
      perms.userTopicRole(user, atopic, function (err, role) {
        if (!err && role) {
          atopic.user_role = {}
          atopic.user_role[uid] = role
        }
        // Filter hidden topics based on the user's permission
        if (self._checkDeleteAccess(atopic, user)) {
          perms.allowedPerms(user, atopic, function (err, retMap) {
            if (!err && retMap) {
              atopic.user_perms = {}
              atopic.user_perms[uid] = retMap[perms.getKey(atopic)]
            // logger.log('debug', 'Added user permissions', atopic.user_perms, 'to', atopic.id)
            }
            callback(err, atopic)
          })
        } else {
          callback(err, null)
        }
      })
    })
  },

  get_topics: function (user, args, includeDeleted, callback) {
    // args['hidden'] = {$ne: true}
    let self = this
    let uid = user ? user._id : null
    db.topics.find(args).sort({path: 1, order: 1, hidden: 1, name: 1}, function (err, topics) {
      if (err || !topics.length || !user) {
        callback(err, topics)
      } else {
        let updatedTopics = new Array(topics.length)
        let done = 0
        topics.forEach(function (atopic, index) {
          self.is_topic_empty(user, atopic, function (err, isEmpty) {
            if (err || isEmpty) {
              atopic.empty = true
            }
            perms.userTopicRole(user, atopic, function (err, role) {
              if (!err && role) {
                atopic.user_role = {}
                atopic.user_role[uid] = role
              }
              // Filter hidden topics based on the user's permission
              if (includeDeleted || self._checkDeleteAccess(atopic, user)) {
                perms.allowedPerms(user, atopic, function (err, retMap) {
                  if (!err && retMap) {
                    atopic.user_perms = {}
                    atopic.user_perms[uid] = retMap[perms.getKey(atopic)]
                  // logger.log('debug', 'Added user permissions', atopic.user_perms, 'to', atopic.id)
                  }
                  updatedTopics[index] = atopic
                  done++
                  if (done === topics.length) {
                    callback(err, _.without(updatedTopics, null))
                  }
                })
              } else {
                updatedTopics[index] = null
                done++
                if (done === topics.length) {
                  callback(err, _.without(updatedTopics, null))
                }
              }
            })
          })
        })
      }
    })
  },

  get_topic_and_parents: function (user, args, callback) {
    let self = this
    this.get_topic(user, args, function (err, topic) {
      if (err) {
        return callback(err)
      }
      self.is_topic_empty(user, topic, function (err, isEmpty) {
        if (err || isEmpty) {
          topic.empty = true
        }
        self._handleSmartTopics(user, topic, function (err, etopiclist) {
          if (err || !etopiclist.length) {
            callback(err, null)
            return
          }
          if (etopiclist.length > 1) {
            logger.log('warn', 'Topic', topic.id, topic.path, 'is linked to multiple topics. This is not supported yet.')
          }
          let etopic = etopiclist[0]

          if (etopic && ('' + etopic._id) !== ('' + topic._id)) {
            etopic.is_expanded = true
            etopic.expanded_for = topic._id
          }
          let path = (topic) ? topic.path : null
          if (!path) {
            callback(err, {
              topic: etopic,
              parents: null
            })
          } else {
            // Use the original topic to identify the parents and not the expanded topic.
            let parents = util.getParents(topic.id, path)
            let done = 0
            if (parents && parents.length) {
              let parentlist = new Array(parents.length)
              parents.forEach(function (aparent, index) {
                self.get_topic(user, {
                  id: aparent.id,
                  path: aparent.path
                }, function (err, parentObj) {
                  parentlist[index] = parentObj
                  done++
                  if (done === parents.length) {
                    callback(err, {
                      topic: etopic,
                      parents: parentlist
                    })
                  }
                })
              })
            } else {
              callback(err, {
                topic: etopic,
                parents: null
              })
            }
          }
        })
      })
    })
  },

  get_topics_by_name_id: function (user, parent_category, name, oid, callback) {
    logger.log('debug', parent_category, name, oid)
    let oidObj = null
    if (oid && util.validOid(oid)) {
      oidObj = db.ObjectId('' + oid)
      return this.get_topic_and_parents(user, {_id: oidObj}, callback)
    }
    if (parent_category == null && name == null) {
      callback(null, null)
    }
    let pathRegex = parent_category ? new RegExp(',' + util.idify(parent_category) + ',') : null
    let args = {
      path: pathRegex,
      $or: [{
        name: util.capitalise(name)
      }, {
        short_name: name
      }, {
        id: name
      }]
    }
    return this.get_topic_and_parents(user, args, callback)
  },

  get_sub_topics: function (user, parent_path, parent_topic_id, includeDeleted, callback) {
    if (!parent_path) {
      parent_path = ','
    }
    // Fetch the sub-topics that directly falls under this topic's path. Also fetch sub-topics if this topic is a base level topic
    // like leadership or education
    let in_clause_list = []
    in_clause_list.push(new RegExp('^' + util.pathify(parent_path + parent_topic_id)))
    // in_clause_list.push(new RegExp('^' + util.pathify(parent_topic_id)))
    let query = {
      path: {
        $in: in_clause_list
      }
    }
    // console.log("gst", query)
    return this.get_topics(user, query, includeDeleted, callback)
  },

  get_all_direct_sub_topics: function (parent_path, parent_topic_id, includeDeleted, callback) {
    return this.get_sub_topics(null, parent_path, parent_topic_id, includeDeleted, callback)
  },

  get_direct_sub_topics: function (parent_path, parent_topic_id, includeDeleted, callback) {
    return this.get_user_sub_topics(null, parent_path, parent_topic_id, false, includeDeleted, callback)
  },

  get_user_sub_topics: function (user, parent_path, parent_topic_id, includeRoot, includeDeleted, callback) {
    if (!parent_path) {
      parent_path = ','
    }
    // Fetch the sub-topics that directly falls under this topic's path. Also fetch sub-topics if this topic is a base level topic
    // like leadership or education
    let in_clause_list = []
    in_clause_list.push(new RegExp(util.pathify(parent_path + parent_topic_id)))
    if (includeRoot) {
      in_clause_list.push(new RegExp('^,' + util.idify(parent_topic_id) + ','))
    }
    let query = {
      path: {
        $in: in_clause_list
      }
    }
    if (user) {
      query['$or'] = [{
        added_by: {
          $in: [user._id, 'colearnr']
        }
      }, {
        collaborators: user._id
      }]
    } else {
      query['added_by'] = 'colearnr'
    }
    // logger.log('debug', 'get_user_sub_topics', query)
    return this.get_topics(user, query, includeDeleted, callback)
  },

  get_virtual_learnbits: function (user, callback) {
    let self = this
    async.parallel({
      liked: function (cb) {
        self.get_learn_bits_arged(user, {likes: '' + user._id}, cb)
      },
      discussed: function (cb) {
        self.get_learn_bits_arged(user, {discussed: '' + user._id}, cb)
      },
      mentioned: function (cb) {
        self.get_learn_bits_arged(user, {mentioned: '' + user._id}, cb)
      }
    }, callback)
  },

  get_user_search_topics: function (user, callback) {
    let args = {type: 'search', path: new RegExp('^,' + user._id + ',search,')}
    this.get_topics(user, args, false, callback)
  },

  get_search_topic: function (user, searchText, callback) {
    if (!searchText) {
      callback(null, false)
      return
    }
    let args = {name: searchText.toLowerCase(), type: 'search', path: new RegExp('^,' + user._id + ',search,')}
    db.topics.findOne(args, function (err, topicObj) {
      callback(err, topicObj)
    })
  },

  get_user_topics: function (user, callback) {
    let self = this
    async.parallel({
      own_topics: function (cb) {
        self.get_topics(user, {$or: [{$and: [{added_by: user._id, path: null}]}]}, false, cb)
      },
      collab_topics: function (cb) {
        self.get_user_collab_topics(user, cb)
      },
      colearnr_topics: function (cb) {
        self.get_user_colearnr_topics(user, cb)
      },
      followed_topics: function (cb) {
        self.get_user_followed_topics(user, cb)
      },
      search_topics: function (cb) {
        self.get_user_search_topics(user, cb)
      }
    }, function (err, results) {
      callback(err, results)
    })
  },

  get_user_all_topics: function (user, callback) {
    let self = this
    async.parallel({
      own_topics: function (cb) {
        self.get_topics(user, {added_by: user._id}, false, cb)
      },
      collab_topics: function (cb) {
        self.get_user_collab_topics(user, cb)
      },
      colearnr_topics: function (cb) {
        self.get_user_colearnr_topics(user, cb)
      },
      followed_topics: function (cb) {
        self.get_user_followed_topics(user, cb)
      }
    }, function (err, results) {
      callback(err, results)
    })
  },

  convert_to_tree: function (topics, callback) {
    let tplTopicMap = {}
    let tplTopicList = []
    let path_id_map = {}

    let addToMap = function (currentNode) {
      let curr_topics = tplTopicMap[currentNode.path] || []
      curr_topics.push(currentNode)
      tplTopicMap[util.pathify(currentNode.path)] = curr_topics
    }

    for (let k in topics) {
      let full_path = util.get_full_path(topics[k])
      path_id_map[full_path] = topics[k]._id
      topics[k].full_path = full_path
      topics[k].level = topics[k].path ? topics[k].path.split(',').length - 1 : 1
      addToMap(topics[k])
    }

    topics.forEach(function (atopic) {
      let full_path = util.get_full_path(atopic)
      // console.log(full_path)
      if (tplTopicMap[full_path]) {
        atopic.topics = tplTopicMap[full_path]
        delete tplTopicMap[full_path]
      }
    })

    // console.log(JSON.stringify(tplTopicMap))
    for (let i in tplTopicMap) {
      for (let l in tplTopicMap[i]) {
        tplTopicList.push(tplTopicMap[i][l])
      }
    }

    // console.log(tplTopicList)
    callback(null, tplTopicList)
  },

  get_topic_tree: function (user, args, callback) {
    let self = this
    this.get_topics(user, args, false, function (err, topics) {
      if (err || !topics.length) {
        callback(err, null)
      } else {
        self.convert_to_tree(topics, callback)
      }
    })
  },

  get_user_collab_topics: function (user, callback) {
    this.get_topic_tree(user, {
      collaborators: user._id,
      colearnrs: {$ne: user._id}
    }, callback)
  },

  get_user_colearnr_topics: function (user, callback) {
    this.get_topic_tree(user, {
      colearnrs: user._id,
      collaborators: {$ne: user._id},
      draft_mode: {$ne: true}
    }, callback)
  },

  get_user_followed_topics: function (user, callback) {
    this.get_topic_tree(user, {followers: user._id, collaborators: {$ne: user._id},
    draft_mode: {$ne: true}}, callback)
  },

  get_two_level_childs: function (parent_path, parent_topic_id, callback) {
    let topiclist = []
    let self = this
    this.get_user_first_childs(null, parent_path, parent_topic_id, function (err, topics) {
      topiclist = topiclist.concat(topics)
      if (!topics.length) {
        callback(err, topiclist)
      }
      let tdone = 0
      topics.forEach(function (atopic) {
        self.get_user_first_childs(null, atopic.path, atopic.id, function (err, ts) {
          topiclist = topiclist.concat(ts)
          tdone++
          if (tdone === topics.length) {
            callback(err, topiclist)
          }
        })
      })
    })
  },

  has_childs: function (parent_path, parent_topic_id, callback) {
    if (!parent_path) {
      parent_path = ','
    }
    let query = {
      path: {
        $in: [new RegExp(util.pathify(parent_path + parent_topic_id) + '$')]
      }
    }
    db.topics.count(query, function (err, count) {
      callback(err, count > 0)
    })
  },

  get_first_childs: function (user, parent_path, parent_topic_id, publicOnly, callback) {
    if (!parent_path) {
      parent_path = ','
    }
    // FIXME: This should be removed
    if (typeof publicOnly === 'function') {
      logger.log('warn', 'Crappy hack is being used in get_first_childs. Please fix ...')
      callback = publicOnly
      publicOnly = false
    }
    // Handle case where the topic is base level topic such as education, leadership
    // let query = {path: {$in: [new RegExp(util.pathify(parent_path + parent_topic_id) + '$'), new RegExp('^,' + util.idify(parent_topic_id) + ',$')]} }
    let query = {
      path: {
        $in: [new RegExp('^' + util.pathify(parent_path + parent_topic_id) + '$')]
      }
    }
    if (publicOnly) {
      query.privacy_mode = 'public'
    }
    this.get_topics(user, query, false, callback)
  },

  get_user_first_childs: function (user, parent_path, parent_topic_id, callback) {
    // console.log('***', parent_path, parent_topic_id)
    if (!parent_path) {
      parent_path = ','
    }
    // Handle case where the topic is base level topic such as education, leadership
    // let query = {path: {$in: [new RegExp(util.pathify(parent_path + parent_topic_id) + ',$'), new RegExp('^,' + util.idify(parent_topic_id) + ',$')]} }
    let query = {
      path: {
        $in: [new RegExp(util.pathify(parent_path + parent_topic_id) + '$')]
      }
    }
    if (user) {
      query['added_by'] = {
        $in: [user._id, 'colearnr']
      }
    }
    // console.log("gfc", query)
    this.get_topics(user, query, false, callback)
  },

  get_few_learn_bits: function (user, tmptopic, limit, callback) {
    let sortArgs = {path: 1, order: 1}
    this.get_recent_learn_bits(user, tmptopic, limit, sortArgs, callback)
  },

  is_topic_empty: function (user, topic, callback) {
    if (topic) {
      let hasNoBody = util.empty(topic.body)
      let hasLearnbits = false
      let hasSubTopics = false
      let self = this
      if (topic.type === 'search') {
        callback(null, false)
      } else {
        db.learnbits.count({topics: {_id: db.ObjectId('' + topic._id)}}, function (err, count) {
          if (err) {
            callback(err, true)
          } else {
            hasLearnbits = (count > 0)
            self.has_childs(topic.path, topic.id, function (err, hasChilds) {
              if (err) {
                callback(err, !hasLearnbits && !hasSubTopics && hasNoBody)
              } else {
                hasSubTopics = hasChilds
                callback(null, !hasLearnbits && !hasSubTopics && hasNoBody)
              }
            })
          }
        })
      }
    } else {
      callback(null, false)
    }
  },

  get_recent_learn_bits: function (user, tmptopic, limit, sortArgs, callback) {
    let self = this
    let sobjids = []
    if (!sortArgs) {
      sortArgs = {path: 1, last_updated: -1}
    }
    self._handleSmartTopics(user, tmptopic, function (err, etopiclist) {
      if (err) {
        return callback(err)
      }
      let regexlist = []
      etopiclist.forEach(function (etopic) {
        sobjids.push({_id: etopic._id})
        regexlist.push(new RegExp(util.pathify((etopic.path || '') + etopic.id) + ''))
      })
      // let args = {path: {$in: [new RegExp(util.pathify(topic.path + topic.id)), new RegExp('^,' + util.idify(topic.id) + ',$')]} }
      let args = {
        path: {
          $in: regexlist
        },
        draft_mode: {$ne: true}
      }
      // console.log('regexlist', args)
      self.get_topics(user, args, false, function (err, topiclist) {
        if (err) {
          callback(err)
        }
        topiclist.forEach(function (at) {
          if (at) {
            if (at.smart && at.linked_topics && at.linked_topics.length) {
              at.linked_topics.forEach(function (alt) {
                if (alt) {
                  sobjids.push({_id: alt._id})
                }
              })
            } else {
              sobjids.push({_id: at._id})
            }
          }
        })
        db.learnbits.aggregate([
          {
            $match: {
              topics: {$in: sobjids},
              safe: true,
              moderation_required: {$ne: true},
              hidden: {$ne: true},
              missing: {$ne: true}
            }
          },
          {$sort: sortArgs},
          {$limit: limit}], function (err, lbits) {
          if (err || !lbits || !lbits.length) {
            callback(err, lbits)
            return
          } else {
            self.setLearnbitMetadata(user, topiclist, lbits, callback)
          }
        })
      })
    })
  },

  get_user_recent_learn_bits: function (user, tmptopic, limit, callback) {
    let self = this
    let sobjids = []
    self._handleSmartTopics(user, tmptopic, function (err, etopiclist) {
      if (err) {
        return callback(err)
      }
      let regexlist = []
      etopiclist.forEach(function (etopic) {
        sobjids.push({_id: etopic._id})
        regexlist.push(new RegExp('^' + util.pathify((etopic.path || '') + etopic.id)))
        regexlist.push(new RegExp('^,' + util.idify(etopic.id) + ',$'))
      })
      // let args = {path: {$in: [new RegExp(util.pathify(topic.path + topic.id) + ',$'), new RegExp('^,' + util.idify(topic.id) + ',$')]} }
      let args = {
        path: {
          $in: regexlist
        },
        draft_mode: {$ne: true}
      }
      if (user) {
        query['$or'] = [{
          added_by: {
            $in: [user._id, 'colearnr']
          }
        }, {
          collaborators: user._id
        }]
      }
      self.get_topics(user, args, false, function (err, topiclist) {
        if (err) {
          return callback(err)
        }
        topiclist.forEach(function (at) {
          if (at.smart && at.linked_topics && at.linked_topics.length) {
            at.linked_topics.forEach(function (alt) {
              if (alt) {
                sobjids.push({_id: alt._id})
              }
            })
          } else {
            sobjids.push({_id: at._id})
          }
        })
        db.learnbits.aggregate({
          $match: {
            topics: {$in: sobjids},
            safe: true,
            moderation_required: {$ne: true},
            hidden: {$ne: true},
            missing: {$ne: true}
          }
        }, {
          $sort: {path: 1, order: 1, added_date: -1}
        }, {$limit: limit}, function (err, lbits) {
          if (err || !lbits || !lbits.length) {
            callback(err, lbits)
            return
          } else {
            self.setLearnbitMetadata(user, topiclist, lbits, callback)
          }
        })
      })
    })
  },

  get_learn_bits_arged: function (user, args, callback) {
    let self = this
    db.learnbits.find(args).sort({last_updated: -1}, function (err, lbits) {
      if (err || !lbits || !lbits.length) {
        callback(err, lbits)
      } else {
        self.setLearnbitMetadata(user, [], lbits, callback)
      }
    })
  },

  get_learn_bits: function (user, topics, callback) {
    let self = this
    let topicListToUse = []
    topics.forEach(function (at) {
      if (at.smart && at.linked_topics && at.linked_topics.length) {
        at.linked_topics.forEach(function (et) {
          if (et) {
            topicListToUse.push(et)
          }
        })
      } else {
        topicListToUse.push(at)
      }
    })
    let args = {
      topics: {$in: topicListToUse},
      safe: true,
      moderation_required: {$ne: true},
      hidden: {$ne: true},
      missing: {$ne: true}
    }
    db.learnbits.find(args).sort({path: 1, order: 1}, function (err, lbits) {
      if (err || !lbits || !lbits.length) {
        callback(err, lbits)
        return
      } else {
        self.setLearnbitMetadata(user, topics, lbits, callback)
      }
    })
  },

  delete_topic: function (user, oid, reallyDelete, callback) {
    let self = this
    let fullyDeleted = false
    logger.log('debug', 'Deleting topic', oid, user._id)
    db.topics.findAndModify({
      query: {_id: db.ObjectId('' + oid)},
      update: {
        $set: {
          hidden: true,
          hidden_by: user._id,
          modified_by: user._id,
          last_updated: new Date()
        }
      },
      new: true
    }, function (err, topic) {
      if (!err && topic) {
        if (topic.collaborators) {
          topic.collaborators.forEach(function (acollab) {
            perms.removeTopicCollabPerms({_id: acollab}, topic, function (err) {
              if (err) {
                logger.log('warn', 'Unable to remove collaborator access for', acollab, 'from topic', topic.id)
              }
            })
          })
        }

        if (topic.colearnrs) {
          topic.colearnrs.forEach(function (acolearnr) {
            perms.removeTopicCoLearnrPerms({_id: acolearnr}, topic, function (err) {
              if (err) {
                logger.log('warn', 'Unable to remove colearnr access for', acolearnr, 'from topic', topic.id)
              }
            })
          })
        }

        if (reallyDelete) {
          logger.log('debug', 'Permanently deleting topic', '' + oid)
          db.topics.remove({_id: db.ObjectId('' + oid)})
          fullyDeleted = true
        } else {
          self.is_topic_empty(user, topic, function (err, isEmpty) {
            if (err || isEmpty) {
              logger.log('debug', 'Permanently deleting topic', '' + oid)
              db.topics.remove({_id: db.ObjectId('' + oid)})
              fullyDeleted = true
            } else {
              self.get_user_sub_topics(user, topic.path, topic.id, false, false, function (err, stopics) {
                logger.log('debug', 'About to delete subtopics for', topic.path, topic.id, 'count', stopics.length)
                if (err) {
                  callback(err, fullyDeleted)
                } else if (stopics && stopics.length) {
                  stopics.forEach(function (atopic) {
                    self.delete_topic(user, atopic._id, reallyDelete, callback)
                  })
                }
              })
            }
          })
        }
      } else {
        callback(err, fullyDeleted)
      }
    })
  },

  undelete_topic: function (user, oid, callback) {
    let self = this
    logger.log('debug', 'UnDeleting topic', oid, user._id)
    db.topics.findAndModify({
      query: {_id: db.ObjectId('' + oid)},
      update: {
        $set: {
          hidden: false,
          hidden_by: null,
          modified_by: user._id,
          last_updated: new Date()
        }
      },
      new: true
    }, function (err, topic) {
      if (!err && topic) {
        if (topic.collaborators) {
          topic.collaborators.forEach(function (acollab) {
            perms.addTopicCollabPerms({_id: acollab}, topic, function (err) {
              if (err) {
                logger.log('warn', 'Unable to add collaborator access for', acollab, 'from topic', topic.id)
              }
            })
          })
        }

        self.get_user_sub_topics(user, topic.path, topic.id, false, false, function (err, stopics) {
          logger.log('debug', 'About to undelete subtopics for', topic.path, topic.id, 'count', stopics.length)
          if (!err && stopics && stopics.length) {
            stopics.forEach(function (atopic) {
              self.undelete_topic(user, atopic._id, callback)
            })
          }
        })
      } else {
        callback(err)
      }
    })
  },

  update_topic: function (name, id, oid, path, order, isCategory, user, skipReorder, link_in, link_out, callback) {
    if (link_in) {
      link_in = _.uniq(link_in)
    }
    if (link_out) {
      link_out = _.uniq(link_out)
    }
    let _doRename = function (atopic) {
      logger.log('info', 'Renaming :', atopic.name, 'to', name, 'id', id)
      let newTopic = _.clone(atopic)
      newTopic['id'] = id
      newTopic['name'] = name
      newTopic['safe'] = true
      newTopic['moderation_required'] = false
      newTopic['hidden'] = false
      newTopic['order'] = (order && parseInt(order, 10) > 0) ? parseInt(order, 10) : null
      newTopic['path'] = path
      newTopic['last_updated'] = new Date()
      newTopic['link_in'] = link_in
      newTopic['link_out'] = link_out
      if (user && user._id) {
        newTopic['modified_by'] = user._id
      }
      db.topics.findAndModify({
        query: {_id: atopic._id},
        update: newTopic,
        new: true
      },
        function (err, atopicNew) {
          if (err) {
            return callback(err)
          }
          self.get_all_direct_sub_topics(atopic.path, atopic.id, true, function (err, stopics) {
            if (!stopics.length) {
              callback(null, atopic)
              return
            }
            let oldpath = '^' + (atopic.path ? atopic.path : ',') + atopic.id + ','
            let newpath = (atopic.path ? atopic.path : ',') + id + ','
            let total_topics = stopics.length
            let done = 0
            logger.log('info', stopics.length, 'topics will get renamed too!')
            stopics.forEach(function (stop) {
              let changedPath = stop.path.replace(new RegExp(util.pathify(oldpath)), newpath)
              logger.log('debug', 'rename', oldpath, changedPath, newpath)
              stop['path'] = changedPath
              stop['last_updated'] = new Date()
              db.topics.findAndModify({
                query: {_id: stop._id},
                update: stop,
                new: true
              })
              done++
              if (total_topics === done) {
                callback(err, atopic)
              }
            })
          })
        })
    } // _doRename

    let _doReshift = function (atopic) {
      let curr_path = atopic.path
      logger.log('info', 'Reshifting :', atopic.name, 'from', curr_path, 'to', path)
      atopic['path'] = path
      atopic['name'] = name
      atopic['order'] = (order && parseInt(order, 10) > 0) ? parseInt(order, 10) : null
      atopic['safe'] = true
      atopic['moderation_required'] = false
      atopic['hidden'] = false
      atopic['last_updated'] = new Date()
      atopic['link_in'] = link_in
      atopic['link_out'] = link_out
      db.topics.findAndModify({
        query: {_id: atopic._id},
        update: atopic,
        new: true
      },
        function (err, atopicNew) {
          if (err) {
            return callback(err)
          }
          self.get_all_direct_sub_topics(curr_path, atopic.id, true, function (err, stopics) {
            if (!stopics.length) {
              callback(err, atopic)
              return
            }
            let oldpath = '^' + (curr_path || ',') + atopic.id + ','
            let newpath = path + atopic.id + ','
            let total_topics = stopics.length
            let done = 0
            logger.log('info', stopics.length, 'topics will get reshifted too!')

            stopics.forEach(function (stop) {
              let changedPath = stop.path.replace(new RegExp(util.pathify(oldpath)), newpath)
              logger.log('debug', 'Reshift', oldpath, changedPath, newpath)
              stop['path'] = changedPath
              stop['last_updated'] = new Date()

              db.topics.findAndModify({
                query: {_id: stop._id},
                update: stop,
                new: true
              })
              done++
              if (total_topics === done) {
                callback(err, atopic)
              }
            })
          })
        })
    } // _doReshift

    let added_by = user._id
    let self = this
    // Handle new topics and rename
    let dbargs = {
      id: id,
      path: path
    }
    if (oid) {
      dbargs = {
        _id: db.ObjectId('' + oid)
      }
    }
    // console.log('dbargs', dbargs)
    // logger.log('debug', 'update_topic', name, id, oid, path, order, added_by, skipReorder, link_in, link_out)
    db.topics.findOne(dbargs, function (err, atopic) {
      if (err) {
        console.error('Error during update', err, dbargs)
        callback(err, atopic)
        return
      }
      if (atopic) {
        if (atopic.name !== name) { // Topic has got renamed
          perms.checkTopicEditAccess(user, atopic, function (err, isAllowed) {
            if (err) {
              return callback(err)
            }
            if (!isAllowed) {
              logger.log('warn', 'User', user._id, 'has no permission to edit the topic', atopic.id, '. Rename aborted.')
              callback('NO_PERMISSION', atopic)
              return
            } else {
              // Is there an existing main topic with the new name. If yes, does the user have edit access
              let newTopicCheckArgs = {
                id: id,
                path: path
              }
              logger.log('debug', 'Fetching existing topic', newTopicCheckArgs)
              db.topics.findOne(newTopicCheckArgs, function (err, exisPathTopic) {
                if (err) {
                  return callback(err)
                }
                if (exisPathTopic) {
                  perms.checkTopicEditAccess(user, exisPathTopic, function (err, isAllowed) {
                    if (err) {
                      return callback(err)
                    }
                    if (!isAllowed) {
                      logger.log('warn', 'User', user._id, 'has no permission to edit the existing topic', exisPathTopic.id, '. Rename aborted.')
                      callback('NO_PERMISSION', atopic)
                      return
                    } else {
                      _doRename(atopic)
                    }
                  })
                } else {
                  logger.log('debug', 'There is no topic with params', newTopicCheckArgs, '. Allowing rename')
                  _doRename(atopic)
                }
              })
            } // else
          }) // check access
        } else if (path && path !== atopic.path) { // Re-shifting
          perms.checkTopicEditAccess(user, atopic, function (err, isAllowed) {
            if (err) {
              return callback(err)
            }
            if (!isAllowed) {
              logger.log('warn', 'User', user._id, 'has no permission to edit the topic', atopic.id, '. Reshift aborted.')
              callback('NO_PERMISSION', atopic)
              return
            } else {
              let newTopicCheckArgs = util.split_path(path)
              logger.log('debug', 'Fetching existing topic', newTopicCheckArgs, path)
              db.topics.findOne(newTopicCheckArgs, function (err, exisPathTopic) {
                if (err) {
                  return callback(err)
                }
                if (exisPathTopic) {
                  perms.checkTopicEditAccess(user, exisPathTopic, function (err, isAllowed) {
                    if (err) {
                      return callback(err)
                    }
                    if (!isAllowed) {
                      logger.log('warn', 'User', user._id, 'has no permission to edit the existing topic', exisPathTopic.id, '. Reshift aborted.')
                      callback('NO_PERMISSION', atopic)
                      return
                    } else {
                      _doReshift(atopic)
                    }
                  })
                } else {
                  logger.log('debug', 'There is no topic with params', newTopicCheckArgs, '. Allowing reshift')
                  _doReshift(atopic)
                }
              })
            } // else
          }) // check access
        } else if (!skipReorder && atopic.order !== order) {
          perms.checkTopicEditAccess(user, atopic, function (err, isAllowed) {
            if (err || !isAllowed) {
              logger.log('warn', 'User', user._id, 'has no permission to edit the topic', atopic.id, '. Reorder aborted.')
              callback('NO_PERMISSION', atopic)
              return
            } else {
              logger.log('debug', 'Reordering :', atopic.name, 'from', atopic.order, 'to', order)
              atopic.order = order
              atopic.safe = true
              atopic.moderation_required = false
              atopic.hidden = false
              atopic.last_updated = new Date()
              atopic['link_in'] = link_in
              atopic['link_out'] = link_out
              db.topics.save(atopic, function (err) {
                callback(err, atopic)
              })
            } // else
          })
        } else {
          if (!_.isEqual(atopic.link_in, link_in) || !_.isEqual(atopic.link_out, link_out)) {
            atopic.link_in = link_in
            atopic.link_out = link_out
            db.topics.save(atopic, function (err) {
              callback(err, atopic)
            })
          } else {
            callback(err, atopic)
          }
        }
      } else {
        if (util.empty(oid)) { // Topic is new
          let newTopic = {
            id: id,
            name: name,
            path: path,
            order: order,
            added_by: added_by,
            privacy_mode: (added_by && added_by === 'colearnr') ? 'public' : 'private',
            safe: true,
            moderation_required: false,
            hidden: false,
            added_date: new Date(),
            last_updated: new Date(),
            link_in: link_in,
            link_out: link_out
          }
          logger.log('debug', 'Creating new topic', newTopic.id, newTopic.path)
          Step(
            function findDiscussId () {
              let paths = null
              let self = this
              if (path) {
                paths = path.split(',')
              }
              if (!path) { // This is the parent
                db.topics.findOne({id: id, path: null}, self)
              } else if (paths && paths.length > 1 && paths[1]) {
                let parentList = util.getParents(id, path)
                if (parentList && parentList.length) {
                  let immParent = parentList[parentList.length - 1]
                  db.topics.findOne({id: immParent.id, path: immParent.path}, self)
                } else {
                  db.topics.findOne({id: paths[1], path: null}, self)
                }
              } else {
                self(null, null)
              }
            },
            function doModify (err, parentTopic) {
              if (err) {
                return callback(err)
              }
              let self = this
              if (parentTopic) {
                // logger.debug('parentTopic is', parentTopic.name, parentTopic.discuss_id, parentTopic.permission_key)
                if (parentTopic.discuss_id) {
                  newTopic.discuss_id = parentTopic.discuss_id
                }
                if (parentTopic.permission_key) {
                  newTopic.permission_key = parentTopic.permission_key
                  logger.log('debug', 'Copied permission key', newTopic.permission_key)
                }
                if (parentTopic.privacy_mode) {
                  newTopic.privacy_mode = parentTopic.privacy_mode
                  logger.log('debug', 'Copied privacy mode', newTopic.privacy_mode)
                }
                if (parentTopic.collaborators) {
                  newTopic.collaborators = parentTopic.collaborators || []
                  // HACK: If this new topic has a different owner, then make the owner of the parent
                  // as a collaborator. See Bug# 322
                  if (newTopic.added_by !== parentTopic.added_by && parentTopic.added_by !== 'colearnr') {
                    newTopic.collaborators.push(parentTopic.added_by)
                  }
                  // if collaborator is adding a new topic under the parent topic,
                  // the collaborator who is the owner of the new topic, is added as collaborator to the new topic.
                  // Fix: remove the owner from the collaborator list. See Bug#385
                  let collaboratorList = []
                  newTopic.collaborators.forEach(function (collaborator) {
                    if (collaborator !== newTopic.added_by) {
                      collaboratorList.push(collaborator)
                    }
                  })
                  newTopic.collaborators = collaboratorList
                  logger.log('debug', 'Copied collaborators', newTopic.collaborators)
                }
                if (parentTopic.colearnrs) {
                  newTopic.colearnrs = parentTopic.colearnrs || []
                  // Fix: remove the owner from the collaborator list. See Bug#385
                  let colearnrList = []
                  newTopic.colearnrs.forEach(function (acolearnr) {
                    if (acolearnr !== newTopic.added_by) {
                      colearnrList.push(acolearnr)
                    }
                  })
                  newTopic.colearnrs = colearnrList
                  newTopic.draft_mode = parentTopic.draft_mode
                  logger.log('debug', 'Copied colearnrs', newTopic.colearnrs)
                }
              }
              logger.log('debug', 'New topic', newTopic)
              db.topics.save(newTopic, function (err, newTopic1) {
                self(err, newTopic, parentTopic)
              })
            },
            function createPerms (err, topicObjNew, parentTopic) {
              if (err) {
                return callback(err)
              }
              perms.anyRolesAllowed(topicObjNew, function (err, res) {
                if (!res) {
                  perms.addFreeTopicRolePerms(topicObjNew, function (err) {
                    if (err) {
                      logger.log('error', 'Error while creating perms for ', topicObjNew._id, topicObjNew.name, err)
                    } else {
                      if (parentTopic) {
                        perms.copyPerms({
                          _id: added_by
                        }, parentTopic, topicObjNew, function (err) {
                          if (err) {
                            logger.log('error', 'Error while copying perms from ', parentTopic._id, parentTopic.name, 'to', topicObjNew._id, err)
                          }
                        })
                      }
                    }
                  })

                  // Permission the collaborators
                  if (topicObjNew.collaborators) {
                    topicObjNew.collaborators.forEach(function (acollab) {
                      perms.addTopicCollabPerms({
                        _id: acollab
                      }, topicObjNew, function (err) {
                        if (err) {
                          logger.log('warn', 'Unable to add collaborator access for', acollab, 'from topic', topicObjNew.id)
                        }
                      })
                    })
                  }

                  // Permission the colearnrs
                  if (topicObjNew.colearnrs) {
                    topicObjNew.colearnrs.forEach(function (acolearnr) {
                      perms.addTopicCoLearnrPerms({
                        _id: acolearnr
                      }, topicObjNew, function (err) {
                        if (err) {
                          logger.log('warn', 'Unable to add colearnr access for', acolearnr, 'from topic', topicObjNew.id)
                        }
                      })
                    })
                  }
                }
                callback(err, topicObjNew)
              })
            }
          )
        } // if
      }
    })
  },

  update_learn_bit: function (id, oldValue, newValue, type, callback) {
    let set_map = {
      'last_updated': new Date()
    }
    let self = this
    if (type === 'topics') {
      self.getIdForTopic(newValue, function (err, atopic) {
        if (err) {
          console.error(err)
          callback(err)
          return
        }
        set_map['topics.$'] = atopic
        db.learnbits.update({_id: db.ObjectId('' + id)}, {$set: set_map}, callback)
      })
    } else {
      set_map[type] = newValue
      db.learnbits.update({_id: db.ObjectId('' + id)}, {$set: set_map}, callback)
    }
  },

  update_topic_quick: function (id, oldValue, newValue, type, callback) {
    let self = this
    let set_map = {
      'last_updated': new Date()
    }
    set_map[type] = newValue
    // If the name is changing, update the id and path
    if (type === 'name') {
      set_map['id'] = util.idify(newValue)
      db.topics.findOne({_id: db.ObjectId('' + id)}, function (err, parentTopic) {
        if (!err && parentTopic) {
          db.topics.update({_id: db.ObjectId('' + id)}, {$set: set_map})
          let oldId = parentTopic.id
          self.get_sub_topics(null, parentTopic.path, parentTopic.id, false, function (err, stopics) {
            if (!err && stopics) {
              stopics.forEach(function (atopic) {
                let oldPath = atopic.path
                let newPath = oldPath.replace(oldId, set_map['id'])
                logger.log('debug', 'Re-shifting topic', atopic.id, 'from', oldPath, 'to', newPath)
                db.topics.update({_id: db.ObjectId('' + atopic._id)}, {$set: {path: newPath}})
              })
              callback()
            }
          })
        } else {
          logger.log('warn', 'No such topic found for quick edit' + id)
          callback()
        }
      })
    } else {
      db.topics.update({_id: db.ObjectId('' + id)}, {$set: set_map}, callback)
    }
  },

  create_topic_from_search: function (q, user, callback) {
    let args = {
      name: q,
      id: util.idify(q),
      path: ',' + user._id + ',search,',
      added_date: new Date(),
      added_by: user._id,
      safe: true,
      privacy_mode: 'private',
      moderation_required: false,
      last_updated: new Date(),
      type: 'search'
    }

    db.topics.save(args, callback)
  },

  create_topic: function (path, name, id, order, author, discuss_id, permission_key, callback) {
    let args = {
      id: id,
      name: name,
      path: path,
      order: (order && parseInt(order, 10) > 0) ? parseInt(order, 10) : null,
      added_date: new Date(),
      added_by: (author || 'colearnr'),
      safe: true,
      privacy_mode: (author && author === 'colearnr') ? 'public' : 'private',
      moderation_required: false,
      last_updated: new Date()
    }
    db.topics.save(args, function (err, topic) {
      callback(err, topic)
    })
  },

  find_or_create_topic: function (path, name, id, order, author, discuss_id, permission_key, callback) {
    let user = {_id: author}
    db.topics.findOne({path: path, id: id, added_by: author}, {id: 1}, function (err, topicObj) {
      if (!topicObj) {
        // console.log("Create Topic", path, id, order, name)
        Step(
          function findDiscussId () {
            let paths = null
            if (path) {
              paths = path.split(',')
            }
            if (paths && paths.length > 1 && paths[1]) {
              // console.log("trying to find discuss id", paths[1])
              db.topics.findOne({id: paths[1], path: null}, this)
            } else {
              this(null, null)
            }
          },
          function doModify (err, parentTopic) {
            if (err) {
              return callback(err)
            }
            if (!discuss_id && parentTopic && parentTopic.discuss_id) {
              discuss_id = parentTopic.discuss_id
            }

            // console.log('Create topic', id, discuss_id, name, path, 'pt:', parentTopic)
            let updateArgs = {
              id: id,
              name: name,
              path: path,
              order: (order && parseInt(order, 10) > 0) ? parseInt(order, 10) : null,
              added_date: new Date(),
              added_by: (author || 'colearnr'),
              safe: true,
              privacy_mode: (author && author === 'colearnr') ? 'public' : 'private',
              moderation_required: false,
              last_updated: new Date()
            }
            if (discuss_id) {
              updateArgs['discuss_id'] = discuss_id
            }
            db.topics.findAndModify({
              query: {
                path: path,
                id: id
              },
              new: true,
              update: updateArgs,
              upsert: true
            }, this)
          },
          function createPerms (err, topicObj) {
            if (err) {
              return callback(err)
            }
            perms.anyRolesAllowed(topicObj, function (err, res) {
              if (err) {
                return callback(err)
              }
              if (!res) {
                perms.addFreeTopicRolePerms(topicObj, function (err) {
                  if (err) {
                    logger.log('error', 'Error while creating perms for ', topicObj._id, topicObj.name, err)
                  }
                })

                perms.addTopicAdminPerms(user, topicObj, function (err) {
                  if (!err) {
                    logger.debug(user._id, 'made the topic expert for the new topic', topicObj.id)
                  }
                })

                // Permission the collaborators
                if (topicObj.collaborators) {
                  topicObj.collaborators.forEach(function (acollab) {
                    perms.addTopicCollabPerms({
                      _id: acollab
                    }, topicObj, function (err) {
                      if (err) {
                        logger.log('warn', 'Unable to add collaborator access to', acollab, 'for topic', topicObj.id)
                      }
                    })
                  })
                }

                // Permission the colearnrs
                if (topicObj.colearnrs) {
                  topicObj.colearnrs.forEach(function (acolearnr) {
                    perms.addTopicCoLearnrPerms({
                      _id: acolearnr
                    }, topicObj, function (err) {
                      if (err) {
                        logger.log('warn', 'Unable to add colearnr access to', acolearnr, 'for topic', topicObj.id)
                      }
                    })
                  })
                }
              }
              callback(err, topicObj)
            })
          }
        )
      } else {
        callback(err, topicObj)
      }
    })
  },

  get_video_last_position: function (user, lbit_oid, topic_oid, callback) {
    let MIN_SECONDS = 10
    if (!user || user._id === 'guest') {
      callback(null, null)
      return
    }
    db.vanalytics.find({
      lbit_id: '' + lbit_oid, topic_id: '' + topic_oid, user: '' + user._id,
      t: {$gt: MIN_SECONDS}
    }, {
      t: 1, timestamp: 1, e: 1
    }).sort({
      timestamp: -1
    }).limit(1, function (err, rows) {
      let row = (rows && rows.length) ? rows[0] : null
      if (err || !row) {
        callback(err, null)
      } else {
        let value = null
        if (row.e && row.e !== 'end') {
          value = parseInt(row.t, 10)
        }
        callback(err, value)
      }
    })
  },

  get_pdf_last_position: function (user, lbit_oid, topic_oid, callback) {
    if (!user || user._id === 'guest') {
      callback(null, null)
      return
    }
    db.analytics.find({
      id: '' + lbit_oid, topic_id: '' + topic_oid, user: '' + user._id, type: 'pdf',
      e: 'scroll'
    }, {id: 1, page: 1, e: 1}).sort({timestamp: -1}).limit(1, function (err, rows) {
      let row = (rows && rows.length) ? rows[0] : null
      if (err || !row) {
        callback(err, null)
      } else {
        let value = null
        if (row.e && row.e !== 'error' && row.e !== 'docloadError') {
          value = parseInt(row.page, 10)
        }
        callback(err, value)
      }
    })
  },

  has_watched: function (user, lbit_oid, topic_oid, duration, callback) {
    if (!user || user._id === 'guest') {
      callback(null, null)
      return
    }
    let self = this
    let MIN_PERCENT = 0.1
    duration = (duration) ? parseInt(duration) : null
    db.vanalytics.find({
      lbit_id: lbit_oid, topic_id: topic_oid, user: '' + user._id, e: 'end'
    }, {t: 1, timestamp: 1, e: 1}).sort({
      timestamp: -1
    }).limit(1, function (err, rows) {
      let row = (rows && rows.length) ? rows[0] : null
      if (err || !row) {
        self.get_video_last_position(user, lbit_oid, topic_oid, function (err, value) {
          let ret = false
          if (!err && value && duration && value > MIN_PERCENT * duration) {
            ret = true
          }
          callback(err, ret)
        })
      } else {
        callback(err, true)
      }
    })
  },

  create_path_tree: function (name, path, discuss_id, permission_key, callback) {
    let paths = path.split(',')
    let tmpPath = null
    let self = this
    let done = 0
    let order = null
    paths.forEach(function (apath, index) {
      if (apath) {
        if (apath.indexOf(':') !== -1) {
          let tmpA = apath.split(':')
          apath = tmpA[1]
          order = tmpA[0]
        }
        // logger.log('debug', "Checking if topic with path", tmpPath, "and id", apath, order, "exists already")
        self.find_or_create_topic(tmpPath, name, apath, order, 'colearnr', discuss_id, permission_key, function (err, topicObj) {
          done++
          if (done === paths.length) {
            callback(err, topicObj)
          }
        })
        if (!tmpPath) {
          tmpPath = ','
        }
        tmpPath += apath + ','
      } else {
        done++
      }
    })
  },

  // This removes all the extra metadata that gets added to a topic and makes it pure.
  // Please update this method if you are dynamically adding columns to topic
  virginify_topic: function (user, topic) {
    topic._id = null
    topic.hidden = null
    topic.hidden_by = null
    topic.added_date = new Date()
    topic.added_by = user._id
    topic.last_updated = null
    topic.privacy_mode = 'private'
    topic.collaborators = null
    topic.colearnrs = null
    topic.order = null
    topic.safe = true
    topic.permission_key = null
    topic.discuss_id = null
    topic.moderation_required = false
    topic.smart = false
    topic.linked_topics = null
    topic.is_expanded = null
    topic.expanded_for = null
    return topic
  },

  add_linked_topic: function (user, parent_topic, sub_topic, callback) {
    if (parent_topic && sub_topic && parent_topic._id && sub_topic._id) {
      db.topics.update({_id: db.ObjectId('' + parent_topic._id)}, {$addToSet: {'link_out': {_id: '' + sub_topic._id}}})
      db.topics.update({_id: db.ObjectId('' + sub_topic._id)}, {$addToSet: {'link_in': {_id: '' + parent_topic._id}}}, callback)
    } else {
      callback()
    }
  },

  remove_all_links: function (user, parent_topic, callback) {
    if (parent_topic && parent_topic._id) {
      let oid = '' + parent_topic._id
      db.topics.update({_id: db.ObjectId(oid)}, {
        $set: {
          'link_out': [],
          last_updated: new Date(),
          modified_by: user._id
        }
      }, callback)

      db.topics.find({link_in: {_id: oid}}, function (err, topiclist) {
        if (!err && topiclist) {
          topiclist.forEach(function (atopic) {
            if (atopic && !util.empty(atopic.link_in)) {
              logger.log('debug', 'Removed link for', oid, 'from', atopic.id, atopic.path)
              db.topics.update({_id: db.ObjectId('' + atopic._id)}, {$pull: {link_in: {_id: oid}}})
            }
          })
        }
      })
    } else {
      callback()
    }
  },

  add_sub_topic: function (user, parent_topic, sub_topic, linkTopic, callback) {
    // Reset all topic specific values
    let self = this
    let stopicid = '' + sub_topic._id
    let newTopicCopy = sub_topic
    newTopicCopy = self.virginify_topic(user, newTopicCopy)
    // Is this topic linked with something else.
    if (linkTopic) {
      logger.log('warn', 'Linking is deprecated', parent_topic, sub_topic)
      newTopicCopy.smart = true
      newTopicCopy.linked_topics = [stopicid]
    }

    // Set the path based on parent_topic
    if (parent_topic) {
      newTopicCopy.path = (parent_topic.path || ',') + parent_topic.id + ','
    }
    db.topics.findOne({
      id: newTopicCopy.id,
      path: newTopicCopy.path
    }, function (err, exisTopic) {
      if (err) {
        callback(err, null)
      } else if (exisTopic) {
        callback('Another topic exists with the same name in this topic!', null)
      } else {
        db.topics.save(newTopicCopy, function (err, newTopicObj) {
          logger.log('debug', 'Added new subtopic', newTopicObj.id, newTopicObj.path)
          // console.log(newTopicObj)
          // Make the user the admin for this new topic
          perms.addTopicAdminPerms(user, newTopicObj, function (err) {
            if (err) {
              logger.log('error', 'Unable to make the user admin', err, newTopicObj)
            }
          })

          // Permission this topic for the parent topic collaborators
          if (parent_topic.collaborators) {
            parent_topic.collaborators.forEach(function (acollab) {
              if (acollab) {
                perms.addTopicCollabPerms({
                  _id: acollab
                }, newTopicObj, function (err) {
                  if (err) {
                    logger.log('warn', 'Unable to add collaborator access for', acollab,
                      'from topic', newTopicObj.id, newTopicObj.path)
                  }
                })
              }
            })
          }
          callback(err, newTopicObj)
        })
      }
    })
  },

  is_subtopic_collaborator: function (user, topic, callback) {
    if (user && !user.guestMode && topic) {
      let path = topic.path ? topic.path : ','
      path = path + topic.id + ','
      db.topics.find({path: new RegExp('^' + path), collaborators: user._id}, function (err, topics) {
        if (err || !topics || !topics.length) {
          callback(err, false)
        } else {
          callback(err, true)
        }
      })
    } else {
      callback(null, false)
    }
  },

  _aggCountCallback: function (err, resultObj, callback) {
    if (err || !resultObj) {
      callback(err, null)
    } else {
      let ret = null
      if (resultObj && resultObj.length && resultObj[0] && resultObj[0].count) {
        ret = resultObj[0].count
      }
      callback(null, ret)
    }
  },

  get_total_active_users: function (callback) {
    let self = this
    db.users.aggregate([
      {$match: {emails: {$not: /colearnr/}, hidden: {$ne: true}}},
      {$group: {_id: null, count: {$sum: 1}}}
    ], function (err, resultObj) {
      self._aggCountCallback(err, resultObj, callback)
    })
  },

  get_user_topics_count: function (user, callback) {
    let self = this
    db.topics.aggregate([
      {$match: {added_by: user._id, id: {$not: /^new-topic/}}},
      {$group: {_id: null, count: {$sum: 1}}}
    ], function (err, resultObj) {
      self._aggCountCallback(err, resultObj, callback)
    })
  },

  get_random_topics: function (user, count, callback) {
    let self = this
    let orList = []
    if (user && user._id && !user.guestMode) {
      orList.push({added_by: user._id})
      orList.push({collaborators: user._id})
      orList.push({followers: user._id})
      orList.push({colearnrs: user._id})
    }
    orList.push({privacy_mode: 'public'})

    db.topics.find({
      $or: orList,
      hidden: {$ne: true},
      path: null,
      moderation_required: false,
      safe: true
    }).limit(count).sort({name: 1}, function (err, topics) {
      if (err) return callback(err, null)
      self._processRandomTopics(user, count, topics, callback)
    })
  },

  expandUsers: function (topicObj, callback) {
    let users = []
    let userObjMap = {}
    if (!topicObj) {
      return topicObj
    }
    if (topicObj.added_by) {
      users.push(topicObj.added_by)
    }

    function _checkPush (allusers) {
      if (allusers && allusers.length) {
        allusers.forEach(function (auser) {
          if (util.validEmail(auser)) {
            let id = util.create_hash(auser)
            users.push(id)
          } else {
            users.push(auser)
          }
        })
      }
    }

    function _expand (allusers) {
      let usersList = []
      if (allusers && allusers.length) {
        allusers.forEach(function (auser) {
          if (userObjMap[auser]) {
            usersList.push(userObjMap[auser])
          }
        })
        return usersList
      } else {
        return []
      }
    }

    _checkPush(topicObj.collaborators)
    _checkPush(topicObj.colearnrs)

    db.users.find({_id: {$in: users}}, {password: 0, salt: 0, accessToken: 0, rawProfile: 0}, function (err, usersList) {
      if (usersList && usersList.length) {
        usersList.forEach(function (auser) {
          userObjMap[auser._id] = auser
        })
      }

      topicObj.added_by = userObjMap[topicObj.added_by]
      topicObj.collaborators = _expand(topicObj.collaborators)
      topicObj.colearnrs = _expand(topicObj.colearnrs)

      callback(err, topicObj)
    })
  },

  _processRandomTopics: function (user, count, topics, callback) {
    let self = this
    let random_topics = []
    if (!topics || !topics.length) {
      callback(null, null)
    }
    let done = 0
    topics.forEach(function (topic, index) {
      self.get_first_childs(user, topic.path, topic.id, true, function (err, child) {
        if (err) {
          return callback(err)
        }
        random_topics[index] = {
          _id: topic._id,
          id: topic.id,
          name: topic.name,
          submenuList: (child && child.length) ? child.slice(0, 8) : null,
          privacy_mode: topic.privacy_mode,
          last_updated: topic.last_updated,
          added_date: topic.added_date
        }
        done++
        if (done === topics.length) {
          callback(null, random_topics)
        }
      })
    })
  },

  create_access_token: function (contentId, options, callback) {
    db.access_tokens.insert({
      content_id: contentId,
      options: options,
      valid_for_users: options.valid_for_users || null,
      added_by: options.added_by || null,
      added_date: new Date(),
      expire_date: util.getTTLDate(options.ttl)
    }, callback)
  },

  get_access_token: function (user, contentId, tokenId, callback) {
    db.access_tokens.findOne({ _id: db.ObjectId('' + tokenId), content_id: contentId }, callback)
  }
}

module.exports = query
