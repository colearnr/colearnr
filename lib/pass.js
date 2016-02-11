var config = require('./config').config
var userlib = require('./user')
var constants = require('../common/constants')
var user_router = require('../routes/user')
var passport = require('passport')
var topic = require('../routes/topic')
var util = require('../common/util')
var bcrypt = require('bcrypt')
var logger = require('../common/log')
var AccessTokens = require('../lib/access-tokens')
var LocalStrategy = require('passport-local').Strategy
var rangeCheck = require('range_check')
var ipLib = require('ip')

passport.serializeUser(function (userObj, done) {
  // console.log("Calling done in serialise", userObj._id)
  done(null, userObj._id)
})

passport.deserializeUser(function (userId, done) {
  // console.log("Calling done in deserialise", userId)
  userlib.findById(userId, function (err, userObj) {
    // console.log(userObj)
    done(err, userObj)
  })
})

function ensureInternalAccess (req, res, next) {
  var ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress
  ip = ip.replace('::ffff:', '')
  var serverIp = ipLib.address('public', 'ipv4')
  if (ip === serverIp || (rangeCheck.validIp(ip) && rangeCheck.inRange(ip, config.internal_ip))) {
    next()
  } else {
    logger.warn(ip, 'is not an internal ip. Access denied')
    res.end()
  }
}

function ensureAuthenticated (req, res, next) {
  // console.log("User in ensureAuthenticated", req.user, req.isAuthenticated())
  // logger.log('debug', 'Cookies', req.cookies)
  var skip = false
  constants.SAFE_URL_LIST.forEach(function (surl) {
    // console.log(req.url.indexOf(surl), surl)
    if (req.url && req.url.indexOf(surl) !== -1) {
      // logger.log('debug', 'Allowing guest access for the url', req.url)
      if (req.user) {
        res.locals.user = req.user
      } else {
        req.user = constants.DEMO_USER
        res.locals.user = constants.DEMO_USER
      }
      skip = true
    }
  })

  if (skip) {
    next()
    return
  }

  if (_redirectsIfNotAuthenticated(req, res)) return

  // Set the user, req, res to the locals.
  res.locals.user = req.user
  if (req.user && !req.xhr && !userlib.isComplete(req.user)) {
    return user_router.complete_check(req, res)
  } else {
    next()
  }
}

function ensureConditionalAccess (req, res, next) {
  // logger.log('debug', 'ensureConditionalAccess')
  var parent_category = req.params['parent_category'] || null
  var topicname = req.params['topicname'] || null
  var topic_oid = req.params['topic_oid'] || req.params['topic_id'] || null
  var userId = req.params['userId'] || null
  var contentId = req.params['contentId'] || null
  var tokenId = req.params['tokenId'] || null

  if (req.user) {
    res.locals.user = req.user
    if (!req.xhr && !userlib.isComplete(req.user)) {
      return user_router.complete_check(req, res)
    } else {
      next()
      return
    }
  } else {
    req.user = constants.DEMO_USER
    res.locals.user = constants.DEMO_USER
  }

  if (contentId && tokenId) {
    logger.log('debug', 'Access token based check', userId, contentId, tokenId)
    var domain = util.guessDomain(req.headers['user-agent'])
    var options = {}
    if (domain) {
      options.domain = domain
    }
    AccessTokens.validate({ _id: userId }, contentId, tokenId, options, function (err, result) {
      if (!err || !result) {
        if (_redirectsIfNotAuthenticated(req, res)) {
          return
        } else {
          next()
        }
      } else {
        logger.log('debug', 'Allowing access due to valid access token')
        next()
      }
    })
  } else if (config.topic_guest_access_allowed) {
    topic.get_topic(req, res, function (err, topic_and_parents) {
      if (err) {
        logger.log('error', 'Error retrieving the topic with oid [' + topic_oid + '] name [' + topicname + '] parent category [' + parent_category + ']. ' + err)
        res.render('error-500.ejs', {})
        return
      }
      if (!topic_and_parents) {
        logger.log('error', 'Error retrieving the topic with oid [' + topic_oid + '] name [' + topicname + '] parent category [' + parent_category + ']. The topic is empty.')
        res.render('error-404.ejs', {message: 'No such topic is available on CoLearnr!'})
        return
      }
      if (topic_and_parents && topic_and_parents.topic && topic_and_parents.topic.privacy_mode === 'public') {
        next()
      } else {
        if (_redirectsIfNotAuthenticated(req, res)) {
          return
        } else {
          next()
        }
      }
    })
  } else {
    if (_redirectsIfNotAuthenticated(req, res)) {
      return
    } else {
      next()
    }
  }
}

function _redirectsIfNotAuthenticated (req, res) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    if (req.session) {
      req.session.returnTo = req.originalUrl || req.url
      logger.log('debug', 'Setting the return url after login to', req.session.returnTo)
    }
    res.redirect(constants.LOGIN_PAGE)
    return true
  }
  return false
}

exports.init = function () {
  passport.use(new LocalStrategy(
    {usernameField: 'email'},
    function (email, password, done) {
      /*
       Find the user by email. If there is no user with the given
       username, or the password is not correct, set the user to 'false' in
       order to indicate failure. Otherwise, return the authenticated user.
       */
      process.nextTick(function () {
        userlib.findByEmail(email, function (err, user) {
          // General error bubbled up?
          if (err) {
            return done(err)
          }
          if (!util.validEmail(email)) {
            logger.log('warn', 'Email:', email, 'is invalid')
            return done(null, false, { message: 'INVALID_EMAIL' })
          }
          // User not found in database?
          if (!user) {
            logger.log('warn', email, 'not found in the database')
            return done(null, false, { message: 'NO_EMAIL' })
          }

          bcrypt.hash(password, user.salt, function (err, hash) {
            if (hash === user.password) {
              user.password = null
              user.salt = null
              return done(err, user)
            } else {
              logger.log('warn', 'Invalid password for', email)
              return done(err, false, { message: 'INVALID_PASS' })
            }
          })
        })
      })
    }))
}

exports.ensureAuthenticated = ensureAuthenticated
exports.ensureConditionalAccess = ensureConditionalAccess
exports.passport = passport
exports.ensureInternalAccess = ensureInternalAccess
