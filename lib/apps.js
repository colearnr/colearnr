var _ = require('lodash'),
  config = require('./config').config,
  constants = require('../common/constants'),
  perms = require('./perms'),
  query = require('../common/query'),
  log = require('../common/log'),
  fs = require("fs"),
  path = require('path'),
  entitlement = require('./entitlement'),
  APPS_DIR = path.join(__dirname, '../', 'apps'),
  appModules = {},
  appInfo = {},
  appTypeCache = {},
  util = require('../common/util');

function loadApps() {
  if (!fs.existsSync(APPS_DIR)) {
    return;
  }
  var files = fs.readdirSync(APPS_DIR);
  files.filter(function (file) {
    return fs.statSync(path.join(APPS_DIR, file)).isDirectory();
  }).forEach(function (file) {
    if (!new RegExp('^\\.').test(file)) {
      var module = null;
      try {
        module = require(path.join(APPS_DIR, file));
        appModules[file] = module;
        var info = require(path.join(APPS_DIR, file, '/package.json'));
        appInfo[file] = info;
        appTypeCache[info.learnbitType] = appModules[file];
      } catch (e) {
        log.debug('Ignoring directory', file);
      }
    }
  });
}
loadApps();

(function(Apps) {

  Apps.list = function() {
    return appInfo || {};
  };

  Apps.reload = function() {
    loadApps();
    return appInfo || {};
  };

  Apps.clear = function() {
    appModules = {};
    appInfo = {};
    return appInfo || {};
  };

  Apps.getInfo = function(name) {
    return appInfo[name] || null;
  };

  Apps.get = function(name) {
    return appModules[name];
  };

  Apps.getAll = function() {
    return appModules || {};
  };

  Apps.getForType = function(learnbitType) {
    return appTypeCache[learnbitType] || null;
  };
}(exports));
