'use strict'

let databaseURI = require('./dbURI')
let collections = ['users', 'topics', 'learnbits', 'vanalytics', 'userdata', 'analytics', 'app_analytics', 'urls', 'user_invites', 'crm_contacts', 'access_tokens']
let db = require('mongojs').connect(databaseURI, collections)

module.exports = db
