'use strict'

const config = require('../lib/config').config
const numCPUs = require('os').cpus().length
let maxPoolSize = config.db_pool_size || 20
let authPrefix = ''

if (config.use_cluster) {
  maxPoolSize = Math.round(maxPoolSize / numCPUs)
}

if (config.mongo_username && config.mongo_password) {
  authPrefix = config.mongo_username + ':' + config.mongo_password + '@'
}
const databaseURI = authPrefix + (process.env.MONGO_HOST || config.mongo.host || 'localhost') + '/' + (process.env.MONGO_DB_NAME || config.mongo.database || 'colearnr') + '_acl?slaveOk=true&maxPoolSize=' + maxPoolSize

module.exports = databaseURI
