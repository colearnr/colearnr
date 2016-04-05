'use strict'

let topic = require('./topic')
let lbits = require('./lbits')
let user = require('./user')
let talk = require('./talk')
let config = require('../lib/config').config
let request = require('request')
let passlib = require('../lib/pass')
const API_VERSION = config.API_VERSION || 1
let API_PREFIX = '/api/v' + API_VERSION

module.exports = function (app) {
  // Topic api
  app.get(API_PREFIX + '/topic/map/:oid', passlib.ensureAuthenticated, topic.load_map_api)
  app.get(API_PREFIX + '/topic/search', passlib.ensureAuthenticated, topic.search_api)
  app.get(API_PREFIX + '/topic/quicksearch', passlib.ensureAuthenticated, topic.quicksearch)
  // app.get(API_PREFIX + '/topic/count/:oid', passlib.ensureAuthenticated, topic.count_api)

  // lbit api
  app.get(API_PREFIX + '/lbit/search', passlib.ensureAuthenticated, lbits.search_api)
  app.get(API_PREFIX + '/lbit/count/:oid', passlib.ensureAuthenticated, lbits.count_api)

  // user api
  app.get(API_PREFIX + '/user/search', passlib.ensureAuthenticated, user.search_api)
  app.get(API_PREFIX + '/user/quicksearch', passlib.ensureAuthenticated, user.quicksearch)

  // talk related api
  app.get(API_PREFIX + '/user/auth/check_password', passlib.ensureInternalAccess, talk.check_password)
  app.get(API_PREFIX + '/user/auth/user_exists', passlib.ensureInternalAccess, talk.user_exists)

  app.get(API_PREFIX + '/chat/search', passlib.ensureAuthenticated, user.chat_search_api)
  app.get(API_PREFIX + '/chat/image/:id', passlib.ensureAuthenticated, user.get_chat_image)

  if (config.chat_enabled) {
    app.all(API_PREFIX + '/chat/http-bind', function (req, res) {
      let url = config.chat_bosh_server
      if (req.method === 'GET') {
        request.get(url).pipe(res)
      } else {
        request[req.method.toLowerCase()]({url: url, json: req.body}).pipe(res)
      }
    })
  }
}
