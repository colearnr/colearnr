var https = require("https")
    , log = require("../common/log")
    , _ = require('lodash');

function httpsOp(copts, callback) {
    var opts = {
        hostname: 'api.singly.com'
    }
    _.merge(opts, copts);
    console.log(opts);
    https.request(opts, function (res) {
        var data = "";
        res.on("data", function (chunk) {
            data += chunk;
        });
        res.on("end", function() {
            callback(data);
        });
    }).on("error", function (e) {
        log.error("Error: ", e);
    }).end();
}

var singly_client = {
    delete_profile: function(access_token, callback) {
        var opts = {
            method: "DELETE",
            path: '/profiles?access_token=' + access_token
        }
        httpsOp(opts, callback);
    }
}

module.exports = singly_client;

client = singly_client.delete_profile('lcYp_Dz7VYz9GviH9QFVfKJILNY.Fvch8DDW710f362727a2927b165effc31c6ead4f9ce73b743e4e1e329cc4bff92519fedee937641d4883620ed72d6d80bab3df9604e11bacf0d20e8e4c7c438e42d9b8e75d0b20ab72d18fb59e0db729a78e47d1663c7df791806a2b7a10e7b8f4591c65', function(data) {
    log.log('debug', data);
});

