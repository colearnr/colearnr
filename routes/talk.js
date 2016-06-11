'use strict'

const util = require('../common/util')
const userlib = require('../lib/user')
const logger = require('../common/log')
const config = require('../lib/config').config
const bcrypt = require('bcrypt')
const request = require('request')

function check_password (req, res) {
  let user = req.query.user
  let server = req.query.server
  let password = req.query.pass
  let email = user + '@' + server
  if (!user || !server || !password) {
    res.status(401).send('Not authorized')
    return
  }

  // Only authenticate if this server is servicing this chat domain.
  // Otherwise forward the request to a different server
  if (server === config.chat_domain) {
    userlib.findByEmail(email, function (err, user) {
      if (err || !user) {
        logger.info(email, 'failed authentication for talk')
        res.status(401).send('Not authorized')
        return
      }
      if (!util.validEmail(email)) {
        logger.info(email, 'failed authentication for talk')
        res.status(404).send('Not found')
        return
      }

      // Purposefully breaking security by supporting api_key based login
      if (password.indexOf('KEY:') !== -1 && (user.api_key && password === ('KEY:' + user.api_key))) {
        logger.debug(email, 'authenticated for talk')
        res.status(200).send('true')
      } else {
        bcrypt.hash(password, user.salt, function (err, hash) {
          if (err) {
            logger.error(err)
          }
          if (hash === user.password) {
            logger.debug(email, 'authenticated for talk')
            res.status(200).send('true')
          } else {
            res.status(401).send('Not authorized')
          }
        })
      }
    })
  } else {
    if (config.route_chat_auth) {
      logger.debug('Forwarding talk authentication to server', server)
      let fwdServer = 'https://' + server + '/api/v1/user/auth/check_password?user=' + user + '&pass=' + password + '&server=' + server
      request(fwdServer).pipe(res)
    } else {
      logger.warn(email, 'cannot be authenticated by this server!')
      res.status(404).send('Not found')
    }
  }
}

function user_exists (req, res) {
  let user = req.query.user
  let server = req.query.server
  let email = user + '@' + server
  if (!user || !server) {
    res.status(404).send('Not found')
    return
  }

  if (server === config.chat_domain) {
    let email = user + '@' + server
    userlib.findByEmail(email, function (err, user) {
      if (err || !user) {
        res.status(404).send('Not found')
        return
      }
      if (!util.validEmail(email)) {
        res.status(404).send('Not found')
      } else {
        res.status(200).send('true')
      }
    })
  } else {
    if (config.route_chat_auth) {
      logger.debug('Forwarding user check to server', server)
      let fwdServer = 'https://' + server + '/api/v1/user/auth/user_exists?user=' + user + '&server=' + server
      request(fwdServer).pipe(res)
    } else {
      logger.warn(email, 'cannot be verified by this server!')
      res.status(404).send('Not found')
    }
  }
}

exports.check_password = function (req, res) {
  check_password(req, res)
}

exports.user_exists = function (req, res) {
  user_exists(req, res)
}
