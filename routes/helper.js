var util = require ("../common/util")
    , query = require("../common/query")
    , logger = require('../common/log')
    , constants = require('../common/constants')
    , db = require('../common/db')
    , analytics = require('./analytics')
    , config = require("../lib/config").config;

function site_tour(req, res) {
  if (req.session) {
    req.session.tourMode = true;
  }
  res.redirect(constants.MY_TOPICS_PAGE);
}

function site_tour_finish(req, res) {
  if (req.session) {
    delete req.session.tourMode;
  }
  res.send("1");
}

function success(req, res) {
  res.send({"result": 1});
}

exports.site_tour = site_tour;
exports.site_tour_finish = site_tour_finish;
exports.success = success;
