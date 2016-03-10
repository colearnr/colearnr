'use strict'

let query = require('../../common/query')
let config = require('../config').config
let constants = require('../../common/constants')
let log = require('../../common/log')
let _ = require('lodash')

;(function (AccessTokens) {
  AccessTokens.create = function (contentId, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }
    if (!options) {
      options = {}
    }
    let ttl = options.ttl || config.default_token_validity || 3600
    if (!options.ttl) {
      options.ttl = ttl
    }
    return query.create_access_token(contentId, options, function (err, accessObj) {
      if (err || !accessObj) {
        log.error('Error creating access token', err)
        return callback(err, null)
      }
      callback(null, accessObj._id)
    })
  }

  AccessTokens.validate = function (user, contentId, tokenId, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }
    if (!options) {
      options = {}
    }
    user = user || constants.DEMO_USER
    query.get_access_token(user, contentId, tokenId, function (err, accessObj) {
      if (err || !accessObj) {
        log.error('Error validating access token', err)
        return callback(null, false)
      }
      if (accessObj.valid_for_users && _.indexOf(accessObj.valid_for_users, user._id) === -1) {
        log.warn(user._id, 'has no access for token', tokenId, accessObj.valid_for_users)
        return callback(null, false)
      }
      // check domain
      if (options.domain !== null && accessObj.options.domain && _.indexOf(accessObj.options.domain, options.domain) === -1) {
        log.warn(user._id, 'has no access for token', tokenId, accessObj.options.domain)
        return callback(null, false)
      }
      return callback(null, true)
    })
  }
}(exports))
