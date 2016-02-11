var cf = require('aws-cloudfront-sign')
var moment = require('moment')
var logger = require('../common/log')
var config = require('./config').config

;(function (Cloud) {
  Cloud.getSignedUrl = function (url, expireTime) {
    var params = {
      keypairId: config.cf_public_key_id || config.cf_backup_public_key_id,
      privateKeyPath: config.cf_private_key || config.cf_backup_private_key,
      expireTime: expireTime || moment().add(120, 'minutes').unix() * 1000
    }
    var surl = null
    try {
      surl = cf.getSignedUrl(url, params)
    } catch (e) {
      logger.log('error', 'Error converting url to signed url', url, e)
    }
    return surl
  }
}(exports))
