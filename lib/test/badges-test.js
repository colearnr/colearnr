'use strict'

const Badges = require('../badges')

Badges.convertEmail('prabhu@colearnr.com', function (err, data) {
  console.log(err, data)
})

Badges.getGroups('prabhu@colearnr.com', function (err, data) {
  console.log(err, data)
})

Badges.getBadges('prabhu@colearnr.com', function (err, data) {
  console.log(err, data)
})
