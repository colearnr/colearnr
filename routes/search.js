'use strict'

let db = require('../common/db')
let query = require('../common/query')
let elasticsearch = require('../common/elasticsearch')
let constants = require('../common/constants')
let _ = require('lodash')
let logger = require('../common/log')

function get_discuss_host (req) {
  let config_lib = require('../lib/config')
  let hostname = req.headers['host'] ? req.headers['host'].split(':')[0] : '127.0.0.1'
  let config = config_lib.config.use_client_host ? config_lib.configure(hostname) : config_lib.config
  return config.socket.address + ((config.socket.port !== 80 && config.socket.port !== 443) ? ':' + config.socket.port : '')
}

exports.search_all = function (req, res) {
  let q = req.query.q
  let pg = req.query.pg || 1
  let pgSize = req.query.pgSize || constants.DEFAULT_SEARCH_PAGE_SIZE
  let type = req.query.type || 'learnbits'
  let user = req.user

  if (!q) {
    return res.json({})
  }

  function _render (err, results) {
    if (err) {
      logger.error(err)
    }
    res.render('search.ejs', {
      results: results, query: req.query.q,
      pg: pg, pgSize: pgSize, type: type, user: user,
      discussion_url: get_discuss_host(req),
      isSearchPage: true
    })
  }
  query.get_search_topic(user, q, function (err, stopic) {
    if (err) {
      logger.error(err)
    }
    switch (type.toLowerCase()) {
      case 'topics':
        elasticsearch.findTopics({ query: q, pg: pg, pgSize: pgSize, user: user, autoComplete: false }, pgSize, function (err, results) {
          if (err) {
            _render(err, { total: 0, suggest: {}, data: null, stopic: stopic })
          } else {
            _render(err, { total: results.hits.total, suggest: results.suggest, data: results.hits.hits, stopic: stopic })
          }
        })
        break

      case 'users':
        elasticsearch.findUsers({ query: q, pg: pg, pgSize: pgSize, user: user, autoComplete: false }, pgSize, function (err, results) {
          if (err) {
            _render(err, { total: 0, suggest: {}, data: null, stopic: stopic })
          } else {
            _render(err, { total: results.hits.total, suggest: results.suggest, data: results.hits.hits, stopic: stopic })
          }
        })
        break

      case 'learnbits':
      default:
        elasticsearch.findLearnbits({query: q, pg: pg, pgSize: pgSize, user: user, autoComplete: false}, pgSize, function (err, results) {
          if (results && results.hits && results.hits.hits) {
            let lbits = results.hits.hits
            let topicIds = []
            lbits.forEach(function (albit) {
              topicIds = _.union(topicIds, albit._source.topics)
            })
            if (topicIds.length) {
              let ftopicIds = topicIds.map(function (aid) {
                return db.ObjectId(aid._id)
              })
              db.topics.find({_id: {$in: ftopicIds}}, function (err, topics) {
                if (err || !topics.length) {
                  _render(err, {total: results.hits.total, suggest: results.suggest, data: lbits, topicIdMap: null, stopic: stopic})
                } else {
                  let topicIdMap = {}
                  topics.forEach(function (atopic) {
                    topicIdMap['' + atopic._id] = atopic
                  })
                  _render(err, {total: results.hits.total, suggest: results.suggest, data: lbits, topicIdMap: topicIdMap, stopic: stopic})
                }
              })
            } else {
              _render(err, {total: results.hits.total, suggest: results.suggest, data: lbits, topicIdMap: null, stopic: stopic})
            }
          } else {
            _render(err, {total: 0, suggest: {}, data: null, topicIdMap: null, stopic: stopic})
          }
        })
        break
    }
  })
}

exports.save_search = function (req, res) {
  let params = req.body
  let user = req.user
  if (!params || !params.q) {
    res.status(500).send('0')
  } else {
    res.send('1')
  }
  query.create_topic_from_search(params.q, user, function (err, topic) {
    if (err) {
      logger.warn('Error while saving search', err)
    } else {
      logger.debug('Saved search as virtual topic', topic.name, topic.path)
    }
  })
}
