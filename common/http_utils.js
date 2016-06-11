'use strict'

const http = require('http')
const https = require('https')
// const log = require('./log')
const util = require('./util')
const url_utils = require('url')
const config = require('../lib/config').config

const HttpUtils = function () {}

HttpUtils.HTTP_TIMEOUT = 20000

HttpUtils.httpAgent = new http.Agent()
HttpUtils.httpAgent.maxSockets = 1
HttpUtils.httpsAgent = new https.Agent()
HttpUtils.DEFAULT_USER_AGENT = config.cl_user_agent || 'CoLearnr Bot'

HttpUtils.httpHeadRequest = function (opts, url, index, data, callback) {
  let req
  let serviceToUse = http
  opts.agent = this.httpAgent
  if (url.indexOf('https') >= 0) {
    opts.agent = HttpUtils.httpsAgent
    serviceToUse = https
  }

  req = serviceToUse.request(opts, function (res) {
    res.on('data', function () {})
    res.on('end', function () {})
    res.setMaxListeners(0)
    callback(res, null, data, index)
  })

  req.setMaxListeners(0)

  /*
  req.on('socket', function (socket) {
      socket.setTimeout(HttpUtils.HTTP_TIMEOUT)
      socket.setMaxListeners(0)
      socket.on('timeout', function() {
          log.log('debug', "Timeout for index: " + index + " url: " + url )
          callback(null, "timeout", data, index)
          //req.abort()
      })
  })
  */

  req.on('error', function (e) {
    callback(null, e, data, index)
  })
  req.end()
}

HttpUtils.getHeaders = function (urlstr, callback) {
  let url = url_utils.parse(urlstr)
  let host = url.host
  let path = url.pathname + (url.search ? url.search : '')

  let opts = {
    method: 'HEAD',
    hostname: host,
    path: path,
    headers: {'User-Agent': HttpUtils.DEFAULT_USER_AGENT}
  }
  HttpUtils.httpHeadRequest(opts, urlstr, null, null, callback)
}

HttpUtils.isFrameRestricted = function (urlstr, callback) {
  if (util.empty(urlstr) || urlstr === '#') {
    callback(null, false)
    return
  }
  let urlType = util.getUrlType(urlstr, null)
  if (urlType === 'html') {
    HttpUtils.getHeaders(urlstr, function (res, err, data, index) {
      let ret = false
      if (res && res.headers && res.headers['x-frame-options']) {
        ret = true
      }
      callback(err, ret)
    })
  } else {
    callback(null, false)
  }
}

module.exports = HttpUtils
