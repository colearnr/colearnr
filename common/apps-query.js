var db = require("./db"),
  query = require("./query"),
  _ = require('lodash'),
  RDB = require('./redis'),
  logger = require('./log'),
  constants = require('./constants'),
  cloud_lib = require('../lib/cloud'),
  Step = require('step'),
  perms = require('../lib/perms'),
  async = require('async'),
  util = require('./util');

var query = {
  createLearnbit: function(user, learnbitType, topicId, callback) {
    if (!user || !learnbitType || !topicId) {
      callback('User, learnbitType and topicId are mandatory', null);
      return;
    }

  }
};

module.exports = query;
