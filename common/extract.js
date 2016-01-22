var EMBEDLY_KEY1 = 'cc49312e11cb40aa9afbe6172894e2d6';
var EMBEDLY_KEY2 = 'a79372f3a70b4406a7ac9af500faa4ba';
var CL_EMBED_KEY = 'e3ce7188681d4205a51dce111b83e7a7';
var PARSE_KEY = 'db1fe36b1aa4410d0ecc4038cedcac48d79b5a98';

var embedly = require('embedly'),
  util = require('./util'),
  log = require("./log"),
  http = require('http'),
  https = require('https'),
  db = require("./db"),
  unembed = require('unembed');

function httpsGet(opts, callback) {
  //console.log(opts);
  https.request(opts, function(res) {
    var data = "";
    res.on("data", function(chunk) {
      data += chunk;
    });
    res.on("end", function() {
      callback(data);
    });
  }).on("error", function(e) {
    log.error("Error: ", e);
  }).end();
}

var extract = function(url, body, callback) {
  if (util.empty(url)) {
    log.log('debug', 'Url is empty! Nothing to extract.');
    callback({});
    return;
  }
  var type = null;
  /*
  if (url == '#' && !util.empty(body)) {
    var parsedBody = unembed.parse(body);
    if (parsedBody.direct_url) {
      url = parsedBody.direct_url;
      type = parsedBody.type;
    }
  }
  */

  if (!type) {
    type = util.getUrlType(url, null);
  }
  switch (type) {
    case 'html':
    case 'hstalks':
    case 'vimeo':
    case 'youtube':
    case 'slideshare':
      db.embedly_cache.findOne({url: url}, {data: 1}, function(err, data) {
        if (!err && data) {
          //log.debug("Data for url " + url + " obtained from cache!");
          callback(data.data);
        }
        else {
          new embedly({key: CL_EMBED_KEY}, function(err, api) {
            if (!!err) {
              log.error('Error creating Embedly api');
              log.error(err.stack + " " + api);
              callback({});
            }

            api.extract({url: url}, function(err, objs) {
              if (err || !objs) {
                log.error('request #1 failed');
                log.error(err.stack + " " + objs);
                callback({});
              }
              //log.info(util.inspect(objs[0]));
              if (objs && objs.length) {
                // cache the data
                db.embedly_cache.insert({url: url, data: objs[0]});
                log.log('debug', "Url " + url + " cached in embedly_cache");
                callback(objs[0]);
              }
            });
          });
        }
      });
      break;

    default:
      callback({});
  }
}

var parse = function(url, callback) {
  var opts = {
    host: "www.readability.com",
    port: 443,
    path: "/api/content/v1/parser?url=" + url + "&token=" + PARSE_KEY,
    method: 'GET'
  }
  db.parse_cache.findOne({url: url}, function(err, data) {
    if (!err && data) {
      callback(data);
    }
    else {
      var hg = new httpsGet(opts, function(data) {
        //console.log('data is', data);
        var json_data = util.parseJson(data);
        if (json_data) {
          db.parse_cache.insert({url: url, data: json_data});
          log.log('debug', "Url " + url + " cached in parse_cache");
        }
        callback(json_data);
      });
    }
  });

}

exports.extract = extract;
exports.parse = parse;
