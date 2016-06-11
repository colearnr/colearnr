'use strict'

const Emailer = require('../emailer')
const ejs = require('ejs')
const config = require('../config')
const fs = require('fs')
const path = require('path')
const WELCOME_TPL = path.resolve(__dirname, 'welcome.html')

/*
 Emailer.send('hello@colearnr.com', 'Team CoLearnr', ['support@colearnr.com'], ['CoLearnr Support team'], 'Test email ' + new Date(), '<strong>Hello</strong><br/>This is a test email sent at ' + new Date() + '<br/><a href="http://www.colearnr.com">CoLearnr</a>', function (err, response) {
 console.log(err, response)
 })
 */

const user = {displayName: 'New user', verification_code: '12345'}
const message = ejs.render(fs.readFileSync(WELCOME_TPL, 'utf8'), {
  filename: WELCOME_TPL,
  user: user,
  base_url: config.base_url + (config.use_port ? (':' + config.port) : '')
})

Emailer.send('hello@colearnr.com', 'Team CoLearnr', ['support@colearnr.com'], ['CoLearnr Support team'], 'Welcome to CoLearnr! ' + new Date(), message, function (err, response) {
  console.log(err, response)
})
