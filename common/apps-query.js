'use strict'

let appsQuery = {
  createLearnbit: function (user, learnbitType, topicId, callback) {
    if (!user || !learnbitType || !topicId) {
      callback('User, learnbitType and topicId are mandatory', null)
      return
    }
  }
}

module.exports = appsQuery
