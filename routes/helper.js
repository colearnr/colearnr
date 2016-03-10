'use strict'

let constants = require('../common/constants')

function site_tour (req, res) {
  if (req.session) {
    req.session.tourMode = true
  }
  res.redirect(constants.MY_TOPICS_PAGE)
}

function site_tour_finish (req, res) {
  if (req.session) {
    delete req.session.tourMode
  }
  res.send('1')
}

function success (req, res) {
  res.send({'result': 1})
}

exports.site_tour = site_tour
exports.site_tour_finish = site_tour_finish
exports.success = success
