var http = require('http')
var https = require('https')
// var log = require('./log')
var util = require('./util')
var url_utils = require('url')
var config = require('../lib/config').config

var HttpUtils = function () {}

HttpUtils.HTTP_TIMEOUT = 20000

HttpUtils.httpAgent = new http.Agent()
HttpUtils.httpAgent.maxSockets = 1
HttpUtils.httpsAgent = new https.Agent()
HttpUtils.DEFAULT_USER_AGENT = config.cl_user_agent || 'CoLearnr Bot'

HttpUtils.httpHeadRequest = function (opts, url, index, data, callback) {
  var req
  var serviceToUse = http
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
  var url = url_utils.parse(urlstr)
  var host = url.host
  var path = url.pathname + (url.search ? url.search : '')

  var opts = {
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
  var urlType = util.getUrlType(urlstr, null)
  if (urlType === 'html') {
    HttpUtils.getHeaders(urlstr, function (res, err, data, index) {
      var ret = false
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
