var util = require('./util')
var log = require('./log')
// var http = require('http')
// var https = require('https')
// var db = require('./db')
// var unembed = require('unembed')

/*
function httpsGet (opts, callback) {
  // console.log(opts)
  https.request(opts, function (res) {
    var data = ''
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

var extract = function (url, body, callback) {
  if (util.empty(url)) {
    log.log('debug', 'Url is empty! Nothing to extract.')
    callback({})
    return
  }
  var type = null
  /*
  if (url == '#' && !util.empty(body)) {
    var parsedBody = unembed.parse(body)
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

var parse = function (url, callback) {
  callback({})
}

exports.extract = extract
exports.parse = parse
