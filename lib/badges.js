const request = require('request')
const util = require('../common/util')

;(function (Badges) {
  Badges.convertEmail = function (email, callback) {
    request.post('http://backpack.openbadges.org/displayer/convert/email',
      {form: {email: email}},
      function (err, req, body) {
        body = util.parseJson(body)
        let userId = null
        if (!err && body && body.status === 'okay' && body.userId) {
          userId = body.userId
        } else if (body && (body.status === 'invalid' || body.status === 'missing')) {
          err = body.error
        }
        callback(err, userId)
      })
  }

  Badges.getGroups = function (email, callback) {
    Badges.convertEmail(email, function (err, userId) {
      if (err || !userId) {
        callback(err, null, null)
      } else {
        request.get('http://backpack.openbadges.org/displayer/' + userId + '/groups.json',
          function (err, req, body) {
            body = util.parseJson(body)
            let groups = null
            if (!err && body && body.groups) {
              groups = body.groups
            }
            callback(err, userId, groups)
          })
      }
    })
  }

  Badges.getBadges = function (email, callback) {
    Badges.getGroups(email, function (err, userId, groups) {
      if (err || !groups || !groups.length) {
        callback(err, null)
      } else {
        let badgeList = []
        let count = 0
        groups.forEach(function (group, index) {
          if (group.badges) {
            request.get('http://backpack.openbadges.org/displayer/' + userId + '/group/' + group.groupId + '.json',
              function (err, req, body) {
                body = util.parseJson(body)
                // console.log(body)
                if (!err && body && body.badges) {
                  badgeList.push(body)
                  count++
                  if (count === groups.length) {
                    callback(err, badgeList)
                  }
                } else {
                  count++
                }
              })
          } else {
            count++
          }
        })
      }
    })
  }
}(exports))
