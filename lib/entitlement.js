var _ = require('lodash')
var config = require('./config').config
var constants = require('../common/constants')
var query = require('../common/query')
var log = require('../common/log')
var platform_plans = require('./platform_plans')
var util = require('../common/util')

;(function (Entitlement) {
  Entitlement.currentPlan = platform_plans[config.platform_plan || 'lite']
  Entitlement.access_code = config.access_code

  Entitlement.setPlan = function (platform_plan) {
    if (platform_plan) {
      Entitlement.currentPlan = platform_plans[platform_plan || 'lite'] || platform_plans['lite']
    }
  }

  Entitlement.setAccessCode = function (access_code) {
    if (access_code) {
      Entitlement.access_code = util.listify(access_code)
    }
  }

  Entitlement.isSignupAllowed = function (user, options, callback) {
    // Returns true to callback if max users reached
    var _maxUsersCheck = function (limit, callback) {
      if (limit === -1) {
        callback(null, true)
      } else {
        query.get_total_active_users(function (err, totalUsers) {
          if (err) {
            return callback(err)
          }
          if (!totalUsers) {
            totalUsers = 0
          }
          var ret = (totalUsers <= limit)
          if (!ret) {
            log.info('Max num of users reached. Current:', totalUsers, '. Allowed:', limit)
          }
          callback(ret ? null : constants.MAX_USERS_REACHED, ret)
        })
      }
    }

    // log.debug('Check if user', user, 'is allowed to signup')
    // Is the signup based on access code?
    if (!util.empty(Entitlement.access_code)) {
      if (options && options.access_code) {
        // Check if access code is correct
        if (_.indexOf(Entitlement.access_code, options.access_code) !== -1) {
          _maxUsersCheck(Entitlement.currentPlan.max_users, callback)
        } else {
          log.debug('Invalid access code', options.access_code)
          callback(constants.INVALID_ACCESS_CODE, false)
        }
      } else {
        log.debug('Invalid access code')
        callback(constants.INVALID_ACCESS_CODE, false)
      }
    } else {
      // Check if we have reached the max users
      _maxUsersCheck(Entitlement.currentPlan.max_users, callback)
    }
  }
}(exports))
