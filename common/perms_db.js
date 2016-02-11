var config = require('../lib/config').config
var numCPUs = require('os').cpus().length
var maxPoolSize = config.db_pool_size || 20
var authPrefix = ''

if (config.use_cluster) {
  maxPoolSize = Math.round(maxPoolSize / numCPUs)
}

if (config.mongo_username && config.mongo_password) {
  authPrefix = config.mongo_username + ':' + config.mongo_password + '@'
}
var databaseURI = authPrefix + (process.env.MONGO_HOST || config.mongo.host || 'localhost') + '/' + (process.env.MONGO_DB_NAME || config.mongo.database || 'colearnr') + '_acl?slaveOk=true&maxPoolSize=' + maxPoolSize

module.exports = databaseURI
