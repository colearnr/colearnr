var databaseURI = require('./dbURI')
var collections = ['users', 'topics', 'learnbits', 'embedly_cache', 'parse_cache', 'vanalytics', 'userdata', 'analytics', 'app_analytics', 'urls', 'user_invites', 'crm_contacts', 'access_tokens']
var db = require('mongojs').connect(databaseURI, collections)

module.exports = db
