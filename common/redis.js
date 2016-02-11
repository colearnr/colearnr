;(function (module) {
  'use strict'

  var RedisDB = null
  var redis = require('redis')
  var util = require('./util')
  var logger = require('./log')
  var config = require('../lib/config').config
  var redis_socket_or_host = config.redis.host

  if (redis_socket_or_host && redis_socket_or_host.indexOf('/') >= 0) {
    /* If redis.host contains a path name character, use the unix dom sock connection. ie, /tmp/redis.sock */
    RedisDB = redis.createClient(config.redis.host)
  } else {
    /* Else, connect over tcp/ip */
    RedisDB = redis.createClient(config.redis.port, config.redis.host)
  }

  if (config.redis.password) {
    RedisDB.auth(config.redis.password)
  }

  RedisDB.on('error', function (err) {
    logger.error('Unable to connect to redis ' + err)
  })

  RedisDB.on('connect', function (err) {
    logger.debug('Reconnecting to redis ... ' + (err || ''))
  })

  RedisDB.on('end', function (err) {
    logger.error('Redis connection closed ' + err)
  })

  var db = parseInt(config.redis.database, 10)
  if (db) {
    RedisDB.select(db, function (error) {
      if (error !== null) {
        logger.error('could not connect to your Redis database. Redis returned the following error: ' + error.message)
      }
    })
  }

  RedisDB.handle = function (error) {
    if (error !== null) {
      logger.error('Problem connecting to redis', error)
    }
  }

  /*
   * A possibly more efficient way of doing multiple sismember calls
   */
  RedisDB.sismembers = function (key, needles, callback) {
    var tempkey = key + ':temp:' + util.generateUUID()
    RedisDB.sadd(tempkey, needles, function () {
      RedisDB.sinter(key, tempkey, function (err, data) {
        RedisDB.del(tempkey)
        callback(err, data)
      })
    })
  }

  /*
   * gets fields of a hash as an object instead of an array
   */
  RedisDB.hmgetObject = function (key, fields, callback) {
    RedisDB.hmget(key, fields, function (err, data) {
      if (err === null) {
        var returnData = {}

        for (var i = 0, ii = fields.length; i < ii; ++i) {
          returnData[fields[i]] = data[i]
        }

        callback(null, returnData)
      } else {
        console.log(err)
        callback(err, null)
      }
    })
  }
  module.exports = RedisDB
}(module))
