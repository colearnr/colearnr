'use strict'

const appsQuery = {
  createLearnbit: function (user, learnbitType, topicId, callback) {
    if (!user || !learnbitType || !topicId) {
      callback('User, learnbitType and topicId are mandatory', null)
    }
  }
}

module.exports = appsQuery
