var db = require('../common/db')
var sitemapUrls = []

function getAllUrls (callback) {
  db.topics.find({privacy_mode: 'public', hidden: {$ne: true}}, function (err, topics) {
    if (err) {
      return callback(err)
    }
    topics.forEach(function (atopic, index) {
      sitemapUrls.push({url: '/topic/' + atopic._id + '/' + atopic.id, changefreq: 'daily', priority: 0.3})
      if (index === topics.length - 1) {
        callback(null, sitemapUrls)
      }
    })
  })
}

exports.getAllUrls = getAllUrls
