const cf = require('aws-cloudfront-sign')
const moment = require('moment')
const logger = require('../common/log')
const config = require('./config').config

;(function (Cloud) {
  Cloud.getSignedUrl = function (url, expireTime) {
    const params = {
      keypairId: config.cf_public_key_id || config.cf_backup_public_key_id,
      privateKeyPath: config.cf_private_key || config.cf_backup_private_key,
      expireTime: expireTime || moment().add(120, 'minutes').unix() * 1000
    }
    let surl = null
    try {
      surl = cf.getSignedUrl(url, params)
    } catch (e) {
      logger.log('error', 'Error converting url to signed url', url, e)
    }
    return surl
  }
}(exports))
