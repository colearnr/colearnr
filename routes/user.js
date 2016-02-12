var util = require('../common/util')
var userlib = require('../lib/user')
var permslib = require('../lib/perms')
var entitlement = require('../lib/entitlement')
var query = require('../common/query')
var logger = require('../common/log')
var constants = require('../common/constants')
var config = require('../lib/config').config
var db = require('../common/db')
var bcrypt = require('bcrypt')
var request = require('request')
var fs = require('fs')
var GridFS = require('../lib/gridfs')
var fse = require('fs-extra')
var path = require('path')
var generatePassword = require('password-generator')
var es = require('../common/elasticsearch')
var _ = require('lodash')

function generateChatEmail (email) {
  if (email) {
    return email.split('@')[0] + '@' + config.chat_domain
  } else {
    return ''
  }
}
function complete (req, res, registerMode) {
  // Check if there are any pending invites for this user and permission automatically
  function _checkPendingInvites (oid, email) {
    // If the user was invited, set the signed_up flag to true
    db.user_invites.findAndModify({
      query: {email: email},
      update: {$set: {signed_up: true}},
      new: true
    }, function (err, invite) {
      if (!err && invite) {
        logger.log('info', 'Marked email', email, 'as signed up')
      }
    })

    db.topics.find({collaborators: email}, function (err, topics) {
      if (err) {
        logger.error(err)
      }
      logger.log('debug', 'Updating email', email, 'with oid for topics', topics.length)
      db.topics.update({collaborators: email}, {$set: {'collaborators.$': oid}}, {multi: true})
      topics.forEach(function (atopic) {
        permslib.addTopicCollabPerms({_id: oid}, atopic, function (err) {
          if (err) {
            logger.log('warn', 'Unable to add collab perms for user', oid, 'for topic', atopic.id, atopic.path)
          }
        })
      })
    })

    // WEB-714 fix
    db.topics.find({colearnrs: email}, function (err, topics) {
      if (err) {
        logger.error(err)
      }
      logger.log('debug', 'Updating email', email, 'with oid for topics', topics.length)
      db.topics.update({colearnrs: email}, {$set: {'colearnrs.$': oid}}, {multi: true})
      topics.forEach(function (atopic) {
        permslib.addTopicCoLearnrPerms({_id: oid}, atopic, function (err) {
          if (err) {
            logger.log('warn', 'Unable to add colearnr perms for user', oid, 'for topic', atopic.id, atopic.path)
          }
        })
      })
    })
  }

  function _doRegister () {
    var error = ''
    db.users.findOne({emails: email}, function (err, exisUser) {
      if (err) {
        logger.log('error', 'Error while trying to find user by email', err)
      }
      if (registerMode && req.user && exisUser && !exisUser.acct_auto_created && req.user._id !== exisUser._id) {
        error = 'That email is assoicated with another account. Do you want to try to login first?'
        res.render('complete-profile.ejs', {profileImage: profileImage, oid: oid,
        name: name, email: email, error: [error]})
        return
      }
      if (!exisUser || exisUser.acct_auto_created || (req.user && req.user._id === exisUser._id)) {
        bcrypt.genSalt(constants.SALT_WORK_FACTOR, function (err, salt) {
          if (err) {
            logger.error(err)
          }
          // hash the password along with our new salt
          bcrypt.hash(password, salt, function (err, hash) {
            if (err) {
              logger.error(err)
            }
            // override the cleartext password with the hashed one
            var args = {displayName: name || '', name: userlib._name(name),
              password: hash,
              agree_terms: agree_terms,
              salt: salt,
              acct_auto_created: false,
              api_key: util.generateUUID(),
              chat_id: generateChatEmail(email),
            emails: [email]}
            if (profileImage) {
              args['profileImage'] = profileImage
            } else {
              args['profileImage'] = config.cdn_prefix + '/images/profile/profile_' + util.random(1, 10) + '.jpg'
            }
            if (oid) {
              db.users.update({_id: oid}, {$set: args}, function () {
                var url = (req.session && req.session.returnTo && req.session.returnTo !== '/undefined' && req.session.returnTo !== constants.LOGIN_PAGE && req.session.returnTo !== constants.REGISTER_PAGE) ? req.session.returnTo : constants.DEFAULT_HOME_PAGE
                delete req.session.returnTo
                if (req.user) {
                  logger.log('debug', 'Redirecting to', url)
                  res.redirect(constants.DEFAULT_HOME_PAGE)
                } else {
                  logger.log('debug', 'Logging in the user automatically', email)
                  // console.log(args)
                  req.logIn(args, function (err) {
                    if (err) {
                      logger.log('error', 'Problem with login', args, err)
                    }
                    res.redirect(url)
                  })
                  _checkPendingInvites(oid, email)
                  userlib.welcome_user(args)
                }
              })
            } else if (email) {
              // We manage _id here in order to make it consistent with the _id that gets updated from singly.
              var id = util.create_hash(email)
              args['_id'] = id
              args['email_verified'] = false
              args['verification_code'] = util.generateUUID()
              args['api_key'] = util.generateUUID()
              args['chat_id'] = generateChatEmail(email)
              args['join_date'] = new Date()
              args['location'] = null
              args['acct_auto_created'] = false
              db.users.save(args, function () {
                logger.log('debug', 'User', args._id, 'got newly created with verification_code',
                  args['verification_code'])
                req.logIn(args, function () {
                  var url = util.getReturnToUrl(req)
                  logger.log('debug', 'Redirecting', id, 'to', url)
                  delete req.session.returnTo
                  res.redirect(url)
                })
                _checkPendingInvites(id, email)
                userlib.welcome_user(args)
              })
            }
          })
        })
      } else {
        error = 'That email is assoicated with another account. Do you want to try to login first?'
        res.render('complete-profile.ejs', {profileImage: profileImage, oid: oid,
        name: name, email: email, error: [error]})
      }
    })
  }

  var profileImage = req.body.profileImage
  var oid = req.body.oid
  var name = util.trim(req.body.name)
  var email = util.trim(req.body.email)
  if (email) {
    email = email.toLowerCase()
  }
  var password = util.trim(req.body.password)
  var agree_terms = req.body.agree_terms
  var access_code = req.body.access_code
  var error_list = []

  if (util.empty(name) || name.length < 5) {
    error_list.push('Full name is missing')
  }
  if (util.empty(email)) {
    error_list.push('Email is missing')
  } else if (!util.validEmail(email)) {
    error_list.push('Email is invalid')
  }
  if (util.empty(password)) {
    error_list.push('Password is missing')
  }
  if (!agree_terms || agree_terms !== 'agreed') {
    error_list.push('You should agree to our terms of use')
  }
  if (config.allowed_domains && config.allowed_domains.length) {
    var matched = false
    config.allowed_domains.forEach(function (adomain) {
      if (email.match(new RegExp(adomain + '$'))) {
        matched = true
      }
    })
    if (!matched) {
      error_list.push('Please use your corporate email to signup')
    }
  }
  if (error_list.length) {
    res.render('complete-profile.ejs', {profileImage: profileImage, oid: oid,
    name: name, email: email, error: error_list})
    return
  }
  if (registerMode) {
    entitlement.isSignupAllowed({emails: [email]}, {access_code: access_code}, function (err, allowed) {
      if (err || !allowed) {
        logger.log('warn', 'Signup is not allowed for', email, access_code, err)
        if (err === constants.INVALID_ACCESS_CODE) {
          error_list.push('Invalid access code. Contact support if you need one')
        } else {
          error_list.push('We are not able to signup new users at the moment. Please contact support')
        }
        res.render('complete-profile.ejs', {profileImage: profileImage, oid: oid,
        name: name, email: email, error: error_list})
        return
      }
      _doRegister()
    })
  } else {
    _doRegister()
  }
}

exports.complete_check = function (req, res) {
  var isError = req.query.error || false
  if (isError) {
    do_logout(req, res)
    res.render('login.ejs', {error: ['Social login has failed. Please use email based login or try again later.']})
  }
  var userObj = req.user
  if (req.url.indexOf('?login') > 0) {
    logger.log('debug', 'Detected a request to go back to login page', userObj._id)
    do_logout(req, res)
    res.render('login.ejs', {user: userObj, oid: userObj._id})
    return
  }
  if (userlib.isComplete(userObj)) {
    var url = (req.session && req.session.returnTo && req.session.returnTo !== '/undefined' && req.session.returnTo.indexOf(constants.LOGIN_PAGE) === -1 && req.session.returnTo.indexOf(constants.REGISTER_PAGE) === -1 && req.session.returnTo.indexOf(constants.AUTH_PAGE) === -1) ? req.session.returnTo : constants.DEFAULT_HOME_PAGE
    delete req.session.returnTo
    res.redirect(url)
  } else {
    if (userObj.temporary_password) {
      logger.log('debug', 'Asking the user to change the password', userObj._id)
      res.render('change-password.ejs', {user: userObj, oid: userObj._id})
    } else {
      var email = (userObj.emails && userObj.emails.length) ? userObj.emails[0] : ''
      if (email) {
        email = email.toLowerCase()
      }
      logger.log('debug', 'Asking the user to complete the profile', userObj._id)
      res.render('complete-profile.ejs', {user: userObj, oid: userObj._id, profileImage: userObj.profileImage,
      name: userObj.displayName, disable_back: true, email: email, error: []})
    }
  }
}

exports.handle_login = function (req, res) {
  var user = req.user
  if (!user) {
    res.status(500).send({error: true, message: 'Invalid email or password'})
    return
  } else {
    req.logIn(user, function () {
      var url = (req.session && req.session.returnTo && req.session.returnTo !== '/undefined' && req.session.returnTo !== constants.LOGIN_PAGE && req.session.returnTo !== constants.REGISTER_PAGE) ? req.session.returnTo : constants.DEFAULT_HOME_PAGE
      if (userlib.isComplete(user)) {
        if (req.session && req.session.returnTo) {
          delete req.session.returnTo
        }
        logger.log('info', 'Asking the user to go to', url)
        res.status(200).send({redirectUrl: url})

        // Patch. Add api key to the user
        if (!user.api_key || !user.chat_id) {
          var api_key = util.generateUUID()
          var chat_id = ''
          if (user.emails && user.emails.length) {
            chat_id = generateChatEmail(user.emails[0])
          }
          db.users.update({_id: user._id}, {$set: {api_key: api_key, chat_id: chat_id}})
        }
      } else {
        if (user.temporary_password) {
          logger.log('info', 'Asking the user to change password')
          res.status(200).send({redirectUrl: '/password/change'})
        } else {
          logger.log('warn', 'Un-predicatable state for the user', user._id)
          res.status(200).send({redirectUrl: url})
        }
      }
    })
  }
}

function do_logout (req, res) {
  if (req.user) {
    var userId = req.user._id
    logger.log('debug', 'user', userId, 'is logging out')
  }
  req.session.returnTo = null
  if (req.session) {
    req.session.destroy()
    req.session = null
  }
  res.clearCookie('connect.sid-' + (process.env.ENV_CONFIG || 'dev'), (config.cookieDomain && config.cookieDomain !== 'localhost') ? {domain: config.cookieDomain, httpOnly: true} : {httpOnly: true})
  req.logout()
}

exports.logout = function (req, res) {
  do_logout(req, res)
  res.redirect(constants.LOGIN_PAGE)
}

exports.handle_register = function (req, res) {
  return complete(req, res, true)
}

exports.edit_profile = function (req, res, registerMode, errorList) {
  var user = req.user
  if (!user || user.guestMode) {
    res.status(500).send('No such user')
  } else {
    res.render('account/edit-profile.ejs', {user: user})
  }
}

exports.save_profile = function (req, res) {
  var oid = req.body.oid
  var name = util.trim(req.body.name)
  var email = util.trim(req.body.email)
  if (email) {
    email = email.toLowerCase()
  }
  var description = util.trim(req.body.description)
  var profileImage = req.body.profileImage
  var img_url = (req.body.img_url) ? util.parseJson(req.body.img_url) : []
  var userEmail = req.user.emails[0]
  var error_list = []
  if (util.empty(name) || name.length < 5) {
    error_list.push('Full name is missing')
  }
  if (util.empty(email)) {
    error_list.push('Email is missing')
  } else if (!util.validEmail(email)) {
    error_list.push('Email is invalid')
  }
  if (config.allowed_domains && config.allowed_domains.length) {
    var matched = false
    config.allowed_domains.forEach(function (adomain) {
      if (email.match(new RegExp(adomain + '$'))) {
        matched = true
      }
    })
    if (!matched) {
      error_list.push('Please use your corporate email to signup')
    }
  }
  if (error_list.length) {
    res.render('account/edit-profile.ejs', {
      user: req.user,
      oid: oid,
      name: name,
      email: email,
      chat_id: null,
      description: description,
      profileImage: profileImage,
      img_url: img_url,
      error: error_list})
    return
  }

  db.users.findOne({emails: email}, function (err, exisUser) {
    var error = ''
    if (err) {
      logger.log('error', 'Error while trying to find user by email', err)
      return
    }
    if (email !== userEmail && exisUser) {
      error = 'That email is associated with another account. Do you want to try to login first?'
      res.render('account/edit-profile.ejs', {
        user: req.user,
        oid: oid,
        name: name,
        email: email,
        chat_id: null,
        description: description,
        img_url: img_url,
        profileImage: profileImage,
        error: [error]})
      return
    }
    if (!exisUser || (req.user && req.user._id === exisUser._id)) {
      var args = {displayName: name || '',
        name: userlib._name(name),
        emails: [email],
        img_url: img_url || [],
      description: description || ''}
      if (profileImage) {
        args['profileImage'] = profileImage
      } else if (img_url && img_url.length) {
        args['profileImage'] = img_url[0]
      }
      if (oid) {
        db.users.update({_id: oid}, {$set: args}, function () {
          res.redirect(constants.DEFAULT_HOME_PAGE)
        })
      }
    } else {
      error = 'That email is in use already! Please use a different one.'
      res.render('account/edit-profile.ejs', {
        user: req.user,
        oid: oid,
        name: name,
        email: email,
        chat_id: null,
        description: description,
        profileImage: profileImage,
        error: [error]})
    }
  })
}

function search (req, response) {
  var q = req.query.q
  var autoComplete = req.query.ac === '1'
  var user = req.user
  var userEmail = (user && user.emails && user.emails.length ? user.emails[0] : null)
  if (userEmail) {
    userEmail = userEmail.toLowerCase()
  }
  if (!q || !user || user.guestMode) {
    response.json({})
    return ''
  }

  es.findUsers({query: q, user: user, autoComplete: autoComplete}, constants.DEFAULT_SEARCH_PAGE_SIZE, function (err, data) {
    if (err) {
      logger.error('Error retrieving search results for users', err)
      response.json({})
      return
    }
    response.json(data)
  })
}

function quicksearch (req, response, isChatSearch) {
  var q = req.query.term || req.query.q
  var user = req.user
  var userEmail = (user && user.emails && user.emails.length ? user.emails[0] : null)
  if (userEmail) {
    userEmail = userEmail.toLowerCase()
  }
  if (!q || !user || user.guestMode) {
    response.json({})
    return ''
  }

  es.findUsers({query: q, user: user, autoComplete: true}, 15, function (err, data) {
    if (err) {
      logger.error('Error retrieving search results for users', err)
      response.json({})
      return
    }
    var userList = []
    data.forEach(function (auser) {
      if (auser && auser._source && auser._source._id) {
        var email = (auser._source.emails.length ? auser._source.emails[0] : '')
        var name_email = auser._source.displayName + (email ? (' <' + email + '>') : '')
        userList.push({
          _id: auser._source._id,
          id: isChatSearch ? (auser._source.chat_id || email) : (auser._source._id),
          name: auser._source.displayName,
          fullname: auser._source.displayName,
          label: name_email,
          value: email,
          profileImage: auser._source.profileImage,
          slug: util.idify(auser._source.displayName)
        })
      }
    })
    response.json(userList)
  })
}

function searchCollaborators (req, response) {
  var q = req.query.term
  var user = req.user
  if (!q) {
    return ''
  }
  query.get_topics(user, {$or: [{added_by: user._id}, {modified_by: user._id}], collaborators: {$ne: null}}, false, function (err, tmptopics) {
    var tmpuserlist = []
    var userlist = []
    var done = 0
    /*
    var userEmail = (user.emails.length ? user.emails[0] : null)
    if (userEmail && q !== userEmail) {
        userlist.push({id: q, label: q, value: q})
    }
    */

    if (err || !tmptopics || !tmptopics.length) {
      logger.log('error', 'Error retrieving search results for user', err)
      response.send(JSON.stringify(userlist))
      return
    }
    for (var i = 0; i < tmptopics.length; i++) {
      if (tmptopics[i].collaborators) {
        tmpuserlist.push(tmptopics[i].collaborators)
      }
    }

    if (tmpuserlist.length) {
      db.users.find({_id: {$in: _.flatten(tmpuserlist)}}, function (err, users) {
        if (!err && users.length) {
          for (var j = 0; j < users.length; j++) {
            var auser = users[j]
            if (auser) {
              var email = (auser.emails.length ? auser.emails[0] : '')
              if (email.indexOf(q) !== -1 || auser.displayName.indexOf(q) !== -1) {
                var name_email = auser.displayName + (email ? (' <' + email + '>') : '')
                userlist.push({id: auser._id, label: name_email, value: email})
              }
            }
            done++
            if (done === users.length) {
              // console.log(JSON.stringify(userlist))
              response.send(JSON.stringify(userlist))
            }
          }
        } else {
          response.send(JSON.stringify(userlist))
        }
      })
    } else {
      response.send(JSON.stringify(userlist))
    }
  })
}

function get_profile_image (req, res) {
  var ret = constants.DEFAULT_PROFILE_IMAGE
  var user_oid = req.params['oid']
  if (!user_oid || user_oid === 'colearnr') {
    request(ret).pipe(res)
  } else {
    db.users.findOne({_id: user_oid}, {profileImage: 1}, function (err, userObj) {
      if (!err && userObj && userObj.profileImage) {
        ret = userObj.profileImage
        res.redirect(ret)
      } else {
        request(ret).pipe(res)
      }
    })
  }
}

function verify (req, res) {
  var code = req.params['code']
  if (!util.empty(code)) {
    db.users.findAndModify({
      query: {verification_code: code, email_verified: false},
      update: {$set: {email_verified: true, verification_code: null, last_updated: new Date()}},
      new: true
    }, function (err, user) {
      if (err || !user) {
        logger.log('warn', 'Invalid verification code', code)
        res.render('login.ejs', {error: ['Invalid verification code used!']})
      } else {
        logger.log('info', 'User', user._id, 'verified successfully with code', code)
        res.redirect('/login')
      }
    })
  } else {
    logger.log('warn', 'Empty verification code passed!')
    res.render('login.ejs', {error: ['Invalid verification code used!']})
  }
}

function reset_password (req, res) {
  var email = util.trim(req.body.email)
  if (email) {
    email = email.toLowerCase()
  }
  logger.log('info', 'Resetting password for', email)
  var error_list = []
  if (util.empty(email)) {
    error_list.push('Email is missing')
  } else if (!util.validEmail(email)) {
    error_list.push('Email is invalid')
  }
  db.users.findOne({emails: email}, function (err, exisUser) {
    if (err || !exisUser) {
      logger.log('error', 'Error while trying to find user by email', err)
      res.status(500).send({error: true, message: 'INVALID_EMAIL'})
    // } else if (exisUser.temporary_password) {
    //    logger.log('error', 'User has already requested temporary password for email', err)
    //    res.status(500).send({error: true, message: 'ALREADY_REQUESTED'})
    } else {
      var tmpPassword = generatePassword(10, false)
      bcrypt.genSalt(constants.SALT_WORK_FACTOR, function (err, salt) {
        if (err) {
          logger.error(err)
        }
        // hash the password along with our new salt
        bcrypt.hash(tmpPassword, salt, function (err, hash) {
          if (err) {
            logger.error(err)
          }
          db.users.findAndModify({
            query: {_id: exisUser._id},
            update: {$set: {password: hash, salt: salt, temporary_password: true, last_updated: new Date()}},
            new: true
          }, function (err, user) {
            if (err || !user) {
              logger.log('error', 'Error while trying to resetting password', err)
              res.status(500).send({error: true, message: 'INVALID_EMAIL'})
            } else {
              userlib.notify_password_reset(exisUser, tmpPassword)
              res.status(200).send({success: true})
            }
          })
        }) // hash
      }) // salt
    }
  })
}

function change_password (req, res) {
  var oid = util.trim(req.body.oid)
  var curr_password = req.body.curr_password
  var password = req.body.password
  logger.log('info', 'Trying to change password for', oid)
  var error_list = []
  var user = req.user
  if (util.empty(curr_password) || util.empty(password)) {
    error_list.push('We need both the current and new password!')
    res.render('change-password.ejs', {user: user, oid: user._id, error: error_list, show_nav: true})
    return
  }

  if (util.trim(curr_password) === util.trim(password)) {
    error_list.push('New password cannot be the same as the current one!')
    res.render('change-password.ejs', {user: user, oid: user._id, error: error_list, show_nav: true})
    return
  }

  db.users.findOne({_id: oid}, function (err, exisUser) {
    if (err || !exisUser) {
      logger.log('error', 'Error while trying to find user by email', err)
      // error_list.push('No such user found!')
      // res.render('change_password.ejs', {user: exisUser, oid: exisUser._id, error: error_list})
      res.redirect('/login')
    } else {
      bcrypt.hash(curr_password, exisUser.salt, function (err, hash) {
        if (err) {
          logger.error(err)
        }
        if (hash === exisUser.password) {
          // Current password is valid. Go ahead and change it
          bcrypt.genSalt(constants.SALT_WORK_FACTOR, function (err, salt) {
            if (err) {
              logger.error(err)
            }
            // hash the password along with our new salt
            bcrypt.hash(password, salt, function (err, hash2) {
              if (err) {
                logger.error(err)
              }
              db.users.findAndModify({
                query: {_id: exisUser._id},
                update: {$set: {password: hash2, salt: salt, temporary_password: null, last_updated: new Date()}},
                new: true
              }, function (err, user) {
                if (err || !user) {
                  logger.log('error', 'Error while trying to resetting password', err)
                  error_list.push('Error during password reset. Please try again!')
                  res.render('change-password.ejs', {user: exisUser, oid: exisUser._id, error: error_list, show_nav: true})
                } else {
                  logger.log('info', 'Password changed successfully for', exisUser._id)
                  res.redirect(constants.DEFAULT_HOME_PAGE)
                }
              })
            }) // hash
          }) // salt
        } else {
          error_list.push('Current password is not valid!')
          res.render('change-password.ejs', {user: exisUser, oid: exisUser._id, error: error_list, show_nav: true})
        }
      })
    }
  })
}

function show_change_password (req, res) {
  res.render('change-password.ejs', {user: req.user, oid: req.user._id, show_nav: true})
}

function get_chat_image (req, res) {
  var ret = constants.DEFAULT_PROFILE_IMAGE
  var chat_id = req.params['id']
  logger.debug('Getting image for chat_id', chat_id)
  if (!chat_id || chat_id === 'colearnr') {
    request(ret).pipe(res)
  } else {
    db.users.findOne({chat_id: chat_id}, {profileImage: 1}, function (err, userObj) {
      if (!err && userObj && userObj.profileImage) {
        res.redirect(userObj.profileImage)
      } else {
        request(ret).pipe(res)
      }
    })
  }
}

function media_upload (req, res) {
  var fstream
  // var sessionid = req.headers['cl-sessionid']
  var user = req.user
  var userPath = path.join(config.upload_base_dir, user._id, 'media')
  req.pipe(req.busboy)
  fse.ensureDirSync(userPath)
  req.busboy.on('file', function (fieldname, file, filename) {
    var fullPath = userPath + '/' + filename
    logger.log('info', 'Receiving: ' + filename + ' from user ' + user._id)
    fstream = fs.createWriteStream(fullPath)
    file.pipe(fstream)
    fstream.on('close', function () {
      // var clUrl = constants.CL_PROTOCOL + user._id + '/' + encodeURIComponent(filename)
      logger.debug(filename, 'uploaded successfully to', userPath)
      // Add to GridFS
      GridFS.storeFile(fullPath, {lbit_id: null, added_by: user._id, topic_id: null}, function (err, fileObj) {
        if (err) {
          logger.error(err)
        }
        logger.info('Stored file ' + filename + ' in grid as ' + fileObj._id)
        res.json({file: fileObj})
      })
    })
  })
}

exports.media_upload = media_upload
exports.complete = complete

exports.searchCollaborators = function (req, response) {
  searchCollaborators(req, response)
}

exports.search = search
exports.search_api = function (req, res) {
  search(req, res)
}

exports.chat_search_api = function (req, res) {
  quicksearch(req, res, true)
}
exports.get_chat_image = function (req, res) {
  get_chat_image(req, res)
}
exports.quicksearch = quicksearch
exports.get_profile_image = get_profile_image
exports.verify = verify
exports.reset_password = reset_password
exports.change_password = change_password
exports.show_change_password = show_change_password
