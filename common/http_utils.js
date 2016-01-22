var http = require("http")
    , https = require("https")
    , log = require("./log")
    , util = require("./util")
    , _ = require('lodash')
    , url_utils = require("url");


var Http_utils = function() {
}

Http_utils.HTTP_TIMEOUT=20000;

Http_utils.httpAgent = new http.Agent();
Http_utils.httpAgent.maxSockets = 1;
Http_utils.httpsAgent = new https.Agent();
Http_utils.DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0';

Http_utils.httpHeadRequest = function(opts, url, index, data, callback) {
    var req;
    var serviceToUse = http;
    opts.agent = this.httpAgent;
    if (url.indexOf('https')>=0) {
        opts.agent = Http_utils.httpsAgent;
        serviceToUse = https;
    }

    req = serviceToUse.request(opts, function (res) {
        res.on('data', function() {});
        res.on('end', function () {});
        res.setMaxListeners(0);
        callback(res, null, data, index);
    });


    req.setMaxListeners(0);

    /*
    req.on('socket', function (socket) {
        socket.setTimeout(Http_utils.HTTP_TIMEOUT);
        socket.setMaxListeners(0);
        socket.on('timeout', function() {
            log.log('debug', "Timeout for index: " + index + " url: " + url );
            callback(null, "timeout", data, index);
            //req.abort();
        });
    });
    */

    req.on('error', function(e) {
        callback(null, e, data, index);
    })
    req.end();
}

Http_utils.getHeaders = function(urlstr, callback) {
    var url = url_utils.parse(urlstr);
    var host = url.host;
    var path = url.pathname + (url.search ? url.search : '');

    var opts = {
        method: "HEAD",
        hostname: host,
        path: path,
        headers: {'User-Agent': Http_utils.DEFAULT_USER_AGENT}
    }
    Http_utils.httpHeadRequest(opts, urlstr, null, null, callback);
}

Http_utils.isFrameRestricted = function(urlstr, callback) {
    if (util.empty(urlstr) || urlstr == "#") {
        callback(null, false);
        return;
    }
    var urlType = util.getUrlType(urlstr, null);
    if (urlType == 'html') {
        Http_utils.getHeaders(urlstr, function(res, err, data, index) {
            var ret = false;
            if (res && res.headers && res.headers['x-frame-options']) {
                ret = true;
            }
            callback(err, ret);
        });
    } else {
        callback(null, false);
    }
}

module.exports=Http_utils;
