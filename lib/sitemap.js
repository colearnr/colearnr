var db = require("../common/db")
    , query = require("../common/query")
    , _ = require('lodash')
    , permlib = require("../lib/perms")
    , logger = require("../common/log")
    , util = require('../common/util');

var sitemapUrls = [];

function getAllUrls(callback) {
    db.topics.find({privacy_mode: 'public', hidden: {$ne: true}}, function (err, topics) {

        topics.forEach(function (atopic, index) {
            sitemapUrls.push({url: '/topic/' + atopic._id + '/' + atopic.id, changefreq: 'daily', priority: 0.3});
            if (index == topics.length - 1) {
                callback(sitemapUrls);
            }
        });
    });
}

exports.getAllUrls = getAllUrls;
