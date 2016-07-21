'use strict'

const config = require('../lib/config')
const query = require('../common/apps-query')
const constants = require('../common/constants')
const log = require('../common/log')
const logger = require('../common/log')
const util = require('../common/util')
const analytics = require('./analytics')
const entitlement = require('../lib/entitlement')
const clApps = require('../lib/apps')
const perms = require('../lib/perms')

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

  let appModules = clApps.getAll()
  if (!util.empty(appModules)) {
    for (let key in appModules) {
      let amodule = appModules[key]
      let info = clApps.getInfo(key)
      if (amodule && amodule.routes) {
        logger.debug('Adding routes for', key)
        middlewares = middlewares || []
        let routes = amodule.routes
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
