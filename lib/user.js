var db = require('../common/db')
var permlib = require('../lib/perms')
var logger = require('../common/log')
var constants = require('../common/constants')
var Emailer = require('../lib/emailer')
var RDB = require('../common/redis')
var ejs = require('ejs')
var fs = require('fs')
var path = require('path')
var config = require('./config').config
var WELCOME_TPL = path.resolve(__dirname, '/../email/templates/welcome.html')
var INVITE_TPL = path.resolve(__dirname, '/../email/templates/invite.html')
var INVITE_COLLAB_TPL = path.resolve(__dirname, '/../email/templates/invite_collab.html')
var INVITE_COLEARNR_TPL = path.resolve(__dirname, '/../email/templates/invite_colearnr.html')
var PASSWORD_RESET_TPL = path.resolve(__dirname, '/../email/templates/password_reset.html')
var util = require('../common/util')

var user = {
  _emails: function (emails) {
    var emaillist = []
    emails.forEach(function (aemail) {
      if (aemail && aemail !== undefined && aemail.value) {
        emaillist.push(aemail.value.toLowerCase())
      }
    })

    return emaillist
  },

  _name: function (displayName) {
    var name = {}
    if (displayName) {
      var capname = util.capitalise(displayName)
      var tmpA = capname.split(' ')
      var fn = ''
      var mn = ''
      var ln = ''
      fn = tmpA[0]
      switch (tmpA.length) {
        case 2:
          ln = tmpA[1]
          break
        case 3:
          mn = tmpA[1]
          ln = tmpA[2]
          break
      }
      name = {first: fn, middle: mn, last: ln}
    }
    return name
  },

  _description: function (profile) {
    var description = ''
    if (profile && profile._json && profile._json.description) {
      description = profile._json.description
    }
    return description
  },

  save: function (accessToken, refreshToken, profile, callback) {
    // console.log(accessToken, refreshToken, profile)
    var self = this
    self.findById(profile.id, function (err, exisObj) {
      if (err || !exisObj) {
        var obj = {
          _id: profile.id,
          emails: self._emails(profile.emails),
          name: self._name(profile.displayName),
          displayName: profile.displayName,
          description: self._description(profile),
          profileImage: profile._json.thumbnail_url,
          location: profile._json.location,
          accessToken: accessToken,
          refreshToken: refreshToken,
          join_date: new Date(),
          corporate: false
        }
        try {
          obj['rawProfile'] = util.stringify(profile)
        } catch (e) {
          console.error(e)
          obj['rawProfile'] = profile
        }
        db.users.save(obj, function (err) {
          if (err) {
            console.error(err)
          }
          permlib.addNewFreeUserPerms(obj, function (err) {
            if (err) {
              logger.log('error', 'Error while creating default roles for user', obj._id)
            } else {
              logger.log('debug', 'Creating default roles for user', obj._id)
            }
          })
          callback(err, obj)
        })
      } else {
        permlib.userRoles(exisObj, function (err, roles) {
          if (err) {
            logger.log('error', 'Error while checking roles for user', exisObj._id)
          }
          if (!roles || !roles.length) {
            permlib.addNewFreeUserPerms(exisObj, function (err) {
              if (err) {
                logger.log('error', 'Error while creating default roles for user', exisObj._id)
              } else {
                logger.log('debug', 'Creating default roles for user', exisObj._id)
              }
            })
          }
        })
        callback(err, exisObj)
      }
    })
  },

  findById: function (id, callback) {
    // logger.log('debug', 'findById', id)
    db.users.findOne({_id: id}, function (err, userObj) {
      callback(err, userObj)
    })
  },

  findByEmail: function (email, callback) {
    if (email) {
      email = email.toLowerCase()
    }
    // logger.log('debug', 'findByEmail', email)
    db.users.findOne({$or: [{emails: email.toLowerCase()}, {chat_id: email.toLowerCase()}]}, function (err, userObj) {
      callback(err, userObj)
    })
  },

  isComplete: function (userObj) {
    var ret = false
    // console.log(userObj)
    if (userObj && userObj.emails && userObj.name && !userObj.temporary_password && userObj.agree_terms && userObj.agree_terms === 'agreed') {
      ret = true
    } else if (userObj.guestMode) {
      ret = true
    }
    return ret
  },

  addUserPerms: function (user, topic, cb) {
    // console.log('>>>', topic)
    permlib.allowedPerms(user, topic, function (err, perms) {
      var done = 0
      if (err) {
        logger.log('error', 'Error while retrieving allowed permissions for user',
          user._id, 'topic', topic._id)
      }
      if (perms && perms[permlib.getKey(topic)]) {
        var plist = perms[permlib.getKey(topic)]
        logger.log('debug', 'User', user._id, 'has permissions', perms, 'for', '' + permlib.getKey(topic))
        if (!plist || !plist.length && cb) {
          cb(user, perms)
        }
        plist.forEach(function (perm, index) {
          if (perm === 'view') {
            user.hasViewPermission = true
          }
          if (perm === 'add') {
            user.hasAddPermission = true
          }
          if (perm === 'edit') {
            user.hasEditPermission = true
          }
          if (perm === 'delete') {
            user.hasDeletePermission = true
          }
          done++
          if (done === plist.length && cb) {
            cb(user, perms)
          }
        })
      } else {
        cb()
      }
    })
  },

  welcome_user: function (user) {
    var aemail = user.emails.length ? user.emails[0] : ''
    if (aemail) {
      aemail = aemail.toLowerCase()
      db.user_invites.findOne({email: aemail}, function (err, invite) {
        if (err) {
          return
        }
        if (!invite) {
          var message = ejs.render(fs.readFileSync(WELCOME_TPL, 'utf8'),
            {
              filename: WELCOME_TPL,
              user: user,
              base_url: config.base_url + (config.use_port ? (':' + config.port) : '')
            })
          Emailer.send(constants.FROM_ADDRESS, constants.FROM_NAME, user.emails, [user.displayName || ''],
            'Welcome to CoLearnr',
            message, function (err, response) {
              if (!err) {
                logger.log('debug', 'Welcomed user', user._id, 'successfully by email')
              }
            })
        } else {
          db.users.findAndModify({
            query: {emails: user.emails},
            update: {$set: {email_verified: true, verification_code: null, last_updated: new Date()}},
            new: true
          }, function (err, invite) {
            if (!err && invite) {
              logger.log('info', 'Marked emails', user.emails, 'as verified since they were invited')
            }
          })
        }
      })
    }
  },

  invite_user: function (user, invited_by) {
    if (user && invited_by && user._id === invited_by._id) {
      return
    }
    var self = this
    db.user_invites.findOne({email: user.email, signed_up: false}, function (err, invite) {
      if (err) {
        return
      }
      if (!invite) {
        var message = ejs.render(fs.readFileSync(INVITE_TPL, 'utf8'),
          {
            filename: INVITE_TPL,
            invited_by: invited_by,
            user: user,
            base_url: config.base_url + (config.use_port ? (':' + config.port) : '')
          })
        Emailer.send(constants.FROM_ADDRESS, constants.FROM_NAME, user.email, [user.displayName || ''],
          invited_by.displayName + ' invites you to CoLearnr',
          message, function (err, response) {
            if (!err) {
              logger.log('debug', 'Invited user', user.email, 'successfully by email')
              db.user_invites.insert({
                email: user.email,
                invited_by: invited_by._id,
                invited_date: new Date(),
                signed_up: false
              })
            }
          })
        self.create_user(user.email, null)
      } else {
        logger.log('debug', user, 'is already invited. Not doing anything!')
      }
    })
  },

  invite_collaborator: function (user, invited_by, topic) {
    if (user && invited_by && user._id === invited_by._id) {
      return
    }
    var self = this
    var path = (topic.path) ? topic.path : (',' + topic.id + ',')
    db.user_invites.findOne({
      email: user.email,
      path: new RegExp('^' + path),
      role: 'collaborator'
    }, function (err, invite) {
      if (err) {
        return
      }
      if (!invite) {
        var message = ejs.render(fs.readFileSync(INVITE_COLLAB_TPL, 'utf8'),
          {
            filename: INVITE_COLLAB_TPL, topic: topic,
            invited_by: invited_by, user: user, base_url: config.base_url + (config.use_port ? (':' + config.port) : '')
          })
        Emailer.send(constants.FROM_ADDRESS, constants.FROM_NAME, user.email, [user.displayName || ''],
          invited_by.displayName + ' invites you to collaborate',
          message, function (err, response) {
            if (!err) {
              logger.log('debug', 'Invited user', user.email, 'to collaborate on', topic.id)
              db.user_invites.insert({
                email: user.email,
                role: 'collaborator',
                invited_by: invited_by._id,
                invited_date: new Date(),
                path: path
              })
            }
          })
        self.create_user(user.email, null)
      } else {
        logger.log('debug', user, 'is already invited to collaborate on', topic.id, '. Not doing anything!')
      }
    })
  },

  invite_colearnr: function (user, invited_by, topic) {
    if (user && invited_by && user._id === invited_by._id) {
      return
    }
    var self = this
    var path = (topic.path) ? topic.path : (',' + topic.id + ',')
    db.user_invites.findOne({email: user.email, path: new RegExp('^' + path)}, function (err, invite) {
      if (err) {
        return
      }
      if (!invite) {
        var message = ejs.render(fs.readFileSync(INVITE_COLEARNR_TPL, 'utf8'),
          {
            filename: INVITE_COLLAB_TPL, topic: topic,
            invited_by: invited_by, user: user, base_url: config.base_url + (config.use_port ? (':' + config.port) : '')
          })
        Emailer.send(constants.FROM_ADDRESS, constants.FROM_NAME, user.email, [user.displayName || ''],
          invited_by.displayName + ' invites you for CoLearning',
          message, function (err, response) {
            if (!err) {
              logger.log('debug', 'Invited user', user.email, 'to CoLearn the topic', topic.id)
              db.user_invites.insert({
                email: user.email,
                role: 'colearnr',
                invited_by: invited_by._id,
                invited_date: new Date(),
                path: path
              })
            }
          })
        self.create_user(user.email, null)
      } else {
        logger.log('debug', user, 'is already invited to CoLearn the topic', topic.id, '. Not doing anything!')
      }
    })
  },

  create_user: function (email, callback) {
    var userObj = {}
    var id = util.create_hash(email)
    db.users.findOne({$or: [{_id: id}, {emails: email}]}, function (err, exisUser) {
      if (exisUser) {
        if (callback) {
          logger.log('debug', 'Not creating new account for user', email)
          callback(err, exisUser)
        }
      } else {
        userObj['_id'] = id
        userObj['email_verified'] = false
        userObj['verification_code'] = util.generateUUID()
        userObj['join_date'] = new Date()
        userObj['location'] = null
        userObj['profileImage'] = config.cdn_prefix + '/images/profile/profile_' + util.random(1, 10) + '.jpg'
        userObj['acct_auto_created'] = true
        userObj['emails'] = [email]
        db.users.save(userObj, function (err) {
          if (callback) {
            callback(err, userObj)
          }
        })
      }
    })
  },

  notify_password_reset: function (user, tmpPassword) {
    var message = ejs.render(fs.readFileSync(PASSWORD_RESET_TPL, 'utf8'),
      {
        filename: PASSWORD_RESET_TPL, password: tmpPassword, user: user,
        request_date: new Date(), base_url: config.base_url + (config.use_port ? (':' + config.port) : '')
      })
    Emailer.send(constants.FROM_ADDRESS, constants.FROM_NAME, user.emails, [user.displayName || ''],
      'Password reset request - CoLearnr',
      message, function (err, response) {
        if (!err) {
          logger.log('debug', 'Notified user', user.emails, 'about password reset')
        }
      })
  },

  getUidBySession: function (session, callback) {
    logger.log('debug', 'session', session)
    RDB.get('sess:' + session, function (err, data) {
      RDB.handle(err)
      data = JSON.parse(data)
      if (data && data.passport && data.passport.user) {
        callback(data.passport.user)
      } else {
        callback(null)
      }
    })
  },

  getOrCreateUser: function (user_oid, callback) {
    var self = this
    logger.log('debug', 'getOrCreateUser', user_oid)
    self.getUserField(user_oid, 'userslug', function (err, userslug) {
      if (!err && userslug) {
        callback(err, user_oid)
      } else {
        self.createFromOid(user_oid, callback)
      }
    })
  }
}

module.exports = user
