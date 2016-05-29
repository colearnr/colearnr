'use strict'

const databaseURI = require('./dbURI')
const mongojs = require('mongojs')
const collections = ['users', 'topics', 'learnbits', 'vanalytics', 'userdata', 'analytics', 'app_analytics', 'urls', 'user_invites', 'crm_contacts', 'access_tokens']
const db = mongojs(databaseURI, collections)

module.exports = db
