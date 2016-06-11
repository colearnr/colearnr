const config = require('./config').config
const logger = require('../common/log')
const sendgrid = require('sendgrid')(config.sendgrid_user, config.sendgrid_key, {api: 'smtp'})
const Email = sendgrid.Email

;(function (Emailer) {
  Emailer.send = function (from, fromName, toList, toNameList, subject, message, callback) {
    const email = new Email({
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
