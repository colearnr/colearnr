var db = require('../common/db'),
  query = require('../common/query'),
  elasticsearch = require('../common/elasticsearch'),
  constants = require('../common/constants'),
  _ = require('lodash'),
  permlib = require('../lib/perms'),
  logger = require('../common/log'),
  async = require('async'),
  util = require('../common/util')

function get_discuss_host (req) {
  var config_lib = require('../lib/config')
  var hostname = req.headers['host'] ? req.headers['host'].split(':')[0] : '127.0.0.1'
  var config = config_lib.config.use_client_host ? config_lib.configure(hostname) : config_lib.config
  return config.socket.address + ((config.socket.port != 80 && config.socket.port != 443) ? ':' + config.socket.port : '')
}

exports.search_all = function (req, res) {
  var q = req.query.q,
    pg = req.query.pg || 1,
    pgSize = req.query.pgSize || constants.DEFAULT_SEARCH_PAGE_SIZE,
    type = req.query.type || 'learnbits',
    user = req.user

  if (!q) {
    return response.json({})
  }

  function _render (err, results) {
    res.render('search.ejs', {
      results: results, query: req.query.q,
      pg: pg, pgSize: pgSize, type: type, user: user,
      discussion_url: get_discuss_host(req),
      isSearchPage: true
    })
  }
  query.get_search_topic(user, q, function (err, stopic) {
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
            var lbits = results.hits.hits
            var topicIds = []
            lbits.forEach(function (albit) {
              topicIds = _.union(topicIds, albit._source.topics)
            })
            if (topicIds.length) {
              var ftopicIds = topicIds.map(function (aid) {
                return db.ObjectId(aid._id)
              })
              db.topics.find({_id: {$in: ftopicIds}}, function (err, topics) {
                if (err || !topics.length) {
                  _render(err, {total: results.hits.total, suggest: results.suggest, data: lbits, topicIdMap: null, stopic: stopic})
                } else {
                  var topicIdMap = {}
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
  var params = req.body,
    user = req.user
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
