'use strict'

let util = require('./util')
let log = require('./log')
// let http = require('http')
// let https = require('https')
// let db = require('./db')
// let unembed = require('unembed')

/*
function httpsGet (opts, callback) {
  // console.log(opts)
  https.request(opts, function (res) {
    let data = ''
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

let extract = function (url, body, callback) {
  if (util.empty(url)) {
    log.log('debug', 'Url is empty! Nothing to extract.')
    callback({})
    return
  }
  let type = null
  /*
  if (url == '#' && !util.empty(body)) {
    let parsedBody = unembed.parse(body)
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

let parse = function (url, callback) {
  callback({})
}

exports.extract = extract
exports.parse = parse
