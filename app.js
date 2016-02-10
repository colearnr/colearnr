/***
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
var express = require('express'),
  params = require('express-params'),
  http = require('http'),
  passlib = require('./lib/pass'),
  config = require('./lib/config').config,
  flash = require('connect-flash'),
  compression = require('compression'),
  session = require('express-session'),
  bodyParser = require('body-parser'),
  RedisStore = require('connect-redis')(session),
  cookieParser = require('cookie-parser'),
  serveStatic = require('serve-static'),
  RDB = require('./common/redis'),
  logger = require('./common/log'),
  socketIOclient = require('socket.io-client'),
  learnApps = require('./lib/apps'),
  path = require('path'),
  cluster = require('cluster'),
  numCPUs = require('os').cpus().length;

if (config.use_cluster && cluster.isMaster) {
  logger.log('debug', 'Forking', numCPUs, 'workers');
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', function(worker) {
    logger.log('debug', 'worker ' + worker.pid + ' died');
  });
} else {
    var app = express();

    params.extend(app);
    /**
     * logs any errors with the application
     */
    function logErrors(err, req, res, next) {
      logger.log('error', 'logError', {stack: err.stack, user: req.user});
      next(err);
    }

    /**
     * Captures any error with the application
     */
    function errorHandler(err, req, res, next) {
      if (req.xhr) {
        res.status(500);
        res.format({
          text: function(){
            res.send('Unable to perform this operation. Please try again later.');
          },
          html: function(){
            res.send('<p>Unable to perform this operation. Please try again later.</p>');
          },
          json: function(){
            res.send({ message: 'Unable to perform this operation. Please try again later.' });
          }
        });
      } else {
        res.status(500);
        res.render('error', { error: err });
      }
      logger.log('error', 'errorHandler', {stack: err.stack, user: req.user});
    }

    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.set('view options', {layout: false});
    app.use(compression({
      threshold: 512
    }));
    app.use(bodyParser.urlencoded({
      extended: false,
      limit: '5mb'
    }));
    app.use(bodyParser.json({
      limit: '5mb'
    }));
    app.use(bodyParser.text({
      type: 'text/plain',
      limit: '5mb'
    }));
    app.use(bodyParser.text({
      type: 'application/xml',
      limit: '5mb'
    }));
    var maxAge = 28800;
    if (!process.env.ENV_CONFIG || process.env.ENV_CONFIG == 'dev') {
      maxAge = 0;
    }

    var allowCrossDomain = function(req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if ('OPTIONS' == req.method) {
        res.sendStatus(200);
      }
      else {
        next();
      }
    };
    app.use(allowCrossDomain);

    app.use(serveStatic(path.join(__dirname, 'public'), {maxAge: maxAge}));
    var appsMap = learnApps.list();
    for (var key in appsMap) {
      var anApp = appsMap[key];
      app.use('/apps/' + key + '-static', serveStatic(path.join(__dirname, 'apps', key, 'src', 'public'), {maxAge: maxAge}));
      logger.debug('Static', '/apps/' + key + '-static');
    }

    app.use(cookieParser());
    var sessionArgs = {
      store: new RedisStore({
        client: RDB,
        ttl: 60*60*24*14
      }),
      resave: true,
      saveUninitialized: true,
      secret: config.secret,
      key: 'connect.sid-' + (process.env.ENV_CONFIG || 'dev')
    };
    var cookieArgs = {
      path: '/',
      maxAge: 1000*60*60*24*14,
      httpOnly: true
    };

    if (config.cookieDomain && config.cookieDomain != "localhost") {
      cookieArgs.domain = config.cookieDomain;
    }

    sessionArgs.cookie = cookieArgs;
    app.use(session(sessionArgs));
    app.use(flash());
    app.use(passlib.passport.initialize());
    app.use(passlib.passport.session());

    app.use(function (req, res, next) {
      if ( req.url.match(/\b.css\b/i) || req.url.match(/\b.js\b/i)
        || req.url.match(/\b.png\b/i) || req.url.match(/\b.jpg\b/i) ) {
        res.header('Cache-Control', 'max-age=28800');
      } else {
        res.header("Cache-Control", "no-cache, no-store, must-revalidate");
        res.header("Pragma", "no-cache");
        res.header("Expires", 0);
      }
      next();
    });

    passlib.init();
    app.use(logErrors);
    app.use(errorHandler);

    if ( 'development' == app.get('env') ) {
      app.locals.pretty = true;
    }

    app.locals.inspect = require('util').inspect;

    require('./routes/api')(app);
    require('./routes/router')(app);

    var server = http.createServer(app).listen(config.port, function () {
      console.log("Express server listening on port " + config.port);
    });

    var socketClient = socketIOclient.connect(config.local_socket_server);

    var tryReconnect = function(){

    if (socketClient.socket.connected === false &&
        socketClient.socket.connecting === false) {
      socketClient.socket.connect();
    }
  };

  setInterval(tryReconnect, 2000);

  socketClient.on('connect', function () {
    // socket connected
    logger.log('debug', 'Connected to discuss');
    global.socket = socketClient;
  });

  socketClient.on('disconnect', function () {
    // socket connected
    logger.log('warn', 'Lost connection to discuss');
  });

  global.server = server;
}
