'use strict'

const util = require('./util')
const log = require('./log')
// const http = require('http')
// const https = require('https')
// const db = require('./db')
// const unembed = require('unembed')

/*
function httpsGet (opts, callback) {
  // console.log(opts)
  https.request(opts, function (res) {
    const data = ''
    res.on('data', function (chunk) {
      data += chunk
    })
    res.on('end', function () {
      callback(data)
    })
  }).on('error', function (e) {
    log.error('Error: ', e)
  }).end()
}
*/

const extract = function (url, body, callback) {
  if (util.empty(url)) {
    log.log('debug', 'Url is empty! Nothing to extract.')
    callback({})
    return
  }
  const type = null
  /*
  if (url == '#' && !util.empty(body)) {
    const parsedBody = unembed.parse(body)
    if (parsedBody.direct_url) {
      url = parsedBody.direct_url
      type = parsedBody.type
    }
  }
  */

  if (!type) {
    type = util.getUrlType(url, null)
  }
  switch (type) {
    case 'html':
    case 'hstalks':
    case 'vimeo':
    case 'youtube':
    case 'slideshare':
      callback({})
      break

    default:
      callback({})
  }
}

const parse = function (url, callback) {
  callback({})
}

exports.extract = extract
exports.parse = parse
