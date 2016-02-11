var config = require('./config').config
var logger = require('../common/log')
var sendgrid = require('sendgrid')(config.sendgrid_user, config.sendgrid_key, {api: 'smtp'})
var Email = sendgrid.Email

;(function (Emailer) {
  Emailer.send = function (from, fromName, toList, toNameList, subject, message, callback) {
    var email = new Email({
      to: toList,
      toname: toNameList,
      from: from,
      fromname: fromName,
      subject: subject,
      html: message,
      date: new Date()
    })
    logger.log('debug', 'Attempting to email', toList, subject)
    sendgrid.send(email, callback)
  }
}(exports))
