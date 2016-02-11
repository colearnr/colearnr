var config = require('../lib/config')
var query = require('../common/apps-query')
var constants = require('../common/constants')
var log = require('../common/log')
var logger = require('../common/log')
var util = require('../common/util')
var analytics = require('./analytics')
var entitlement = require('../lib/entitlement')
var learnApps = require('../lib/apps')
var perms = require('../lib/perms')

function addAppRoutes (app, prefix, middlewares, preCallback, postCallback) {
  // logger.debug('Adding routes for apps')
  function _injectLibs (req, res, fn) {
    if (fn) {
      if (preCallback) {
        preCallback(req, res)
      }
      fn(req, res, {util: util, perms: perms, query: query, constants: constants, config: config, log: log, entitlement: entitlement})
      if (postCallback) {
        postCallback(req, res)
      }
      analytics.app_track(req, null)
    } else {
      res.send(500, 'Operation not supported')
    }
  }

  var appModules = learnApps.getAll()
  if (!util.empty(appModules)) {
    for (var key in appModules) {
      var amodule = appModules[key]
      var info = learnApps.getInfo(key)
      if (amodule && amodule.routes) {
        logger.debug('Adding routes for', key)
        middlewares = middlewares || []
        var routes = amodule.routes
        app.get((prefix || '') + '/' + info.learnbitType + '/new', middlewares, function (req, res) {
          _injectLibs(req, res, routes.create)
        })
        app.get((prefix || '') + '/' + info.learnbitType + 's', middlewares, function (req, res) {
          _injectLibs(req, res, routes.list)
        })
        app.get((prefix || '') + '/' + info.learnbitType + '/:oid', middlewares, function (req, res) {
          _injectLibs(req, res, routes.view)
        })
        app.post((prefix || '') + '/' + info.learnbitType, middlewares, function (req, res) {
          _injectLibs(req, res, routes.save)
        })
        app.put((prefix || '') + '/' + info.learnbitType + '/:oid', middlewares, function (req, res) {
          _injectLibs(req, res, routes.update)
        })
        app.delete((prefix || '') + '/' + info.learnbitType + '/:oid', middlewares, function (req, res) {
          _injectLibs(req, res, routes.remove)
        })
      }
    }
  }
}

exports.addAppRoutes = addAppRoutes
