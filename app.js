/**
  CoLearnr
  Copyright (C) 2016  Prabhu Subramanian <prabhu@colearnr.com>

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
/**
 * Module dependencies.
 */
'use strict'

let express = require('express')
let params = require('express-params')
let http = require('http')
let passlib = require('./lib/pass')
let config = require('./lib/config').config
let flash = require('connect-flash')
let compression = require('compression')
let session = require('express-session')
let bodyParser = require('body-parser')
let RedisStore = require('connect-redis')(session)
let cookieParser = require('cookie-parser')
let serveStatic = require('serve-static')
let RDB = require('./common/redis')
let logger = require('./common/log')
let socketIOclient = require('socket.io-client')
let learnApps = require('./lib/apps')
let path = require('path')
let cluster = require('cluster')
let numCPUs = require('os').cpus().length

function logErrors (err, req, res, next) {
  logger.log('error', 'logError', {stack: err.stack, user: req.user})
  next(err)
}

function errorHandler (err, req, res, next) {
  if (req.xhr) {
    res.status(500)
    res.format({
      text: function () {
        res.send('Unable to perform this operation. Please try again later.')
      },
      html: function () {
        res.send('<p>Unable to perform this operation. Please try again later.</p>')
      },
      json: function () {
        res.send({ message: 'Unable to perform this operation. Please try again later.' })
      }
    })
  } else {
    res.status(500)
    res.render('error', { error: err })
  }
  logger.log('error', 'errorHandler', {stack: err.stack, user: req.user})
}

if (config.use_cluster && cluster.isMaster) {
  logger.log('debug', 'Forking', numCPUs, 'workers')
  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }

  cluster.on('exit', function (worker) {
    logger.log('debug', 'worker ' + worker.pid + ' died')
  })
} else {
  let app = express()
  params.extend(app)
  app.set('views', path.resolve(__dirname, '/views'))
  app.set('view engine', 'ejs')
  app.set('view options', {layout: false})
  app.use(compression({
    threshold: 512
  }))
  app.use(bodyParser.urlencoded({
    extended: false,
    limit: '5mb'
  }))
  app.use(bodyParser.json({
    limit: '5mb'
  }))
  app.use(bodyParser.text({
    type: 'text/plain',
    limit: '5mb'
  }))
  app.use(bodyParser.text({
    type: 'application/xml',
    limit: '5mb'
  }))
  let maxAge = 28800
  if (process.env.NODE_ENV === 'development') {
    maxAge = 0
    app.locals.pretty = true
  }

  let allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if (req.method === 'OPTIONS') {
      res.sendStatus(200)
    } else {
      next()
    }
  }
  app.use(allowCrossDomain)

  app.use(serveStatic(path.resolve(__dirname, 'public'), {maxAge: maxAge}))
  let appsMap = learnApps.list()
  for (let key in appsMap) {
    app.use('/apps/' + key + '-static', serveStatic(path.resolve(__dirname, 'apps', key, 'src', 'public'), {maxAge: maxAge}))
    logger.debug('Static', '/apps/' + key + '-static')
  }

  app.use(cookieParser())
  let sessionArgs = {
    store: new RedisStore({
      client: RDB,
      ttl: 60 * 60 * 24 * 14
    }),
    resave: true,
    saveUninitialized: true,
    secret: config.secret,
    key: 'connect.sid-' + (process.env.ENV_CONFIG || 'dev')
  }
  let cookieArgs = {
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 14,
    httpOnly: true
  }

  if (config.cookieDomain && config.cookieDomain !== 'localhost') {
    cookieArgs.domain = config.cookieDomain
  }

  sessionArgs.cookie = cookieArgs
  app.use(session(sessionArgs))
  app.use(flash())
  app.use(passlib.passport.initialize())
  app.use(passlib.passport.session())

  app.use(function (req, res, next) {
    if (req.url.match(/\b.css\b/i) || req.url.match(/\b.js\b/i) ||
      req.url.match(/\b.png\b/i) || req.url.match(/\b.jpg\b/i)) {
      res.header('Cache-Control', 'max-age=28800')
    } else {
      res.header('Cache-Control', 'no-cache, no-store, must-revalidate')
      res.header('Pragma', 'no-cache')
      res.header('Expires', 0)
    }
    next()
  })

  passlib.init()
  app.use(logErrors)
  app.use(errorHandler)
  app.locals.inspect = require('util').inspect

  require('./routes/api')(app)
  require('./routes/router')(app)

  let server = http.createServer(app).listen(config.port, function () {
    console.log('Express server listening on port ' + config.port)
  })

  let socketClient = socketIOclient.connect(config.local_socket_server)

  let tryReconnect = function () {
    if (socketClient.socket.connected === false &&
      socketClient.socket.connecting === false) {
      socketClient.socket.connect()
    }
  }

  setInterval(tryReconnect, 2000)

  socketClient.on('connect', function () {
    // socket connected
    logger.log('debug', 'Connected to discuss')
    global.socket = socketClient
  })

  socketClient.on('disconnect', function () {
    // socket connected
    logger.log('warn', 'Lost connection to discuss')
  })

  global.server = server
}
