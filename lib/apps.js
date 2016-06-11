const log = require('../common/log')
const fs = require('fs')
const path = require('path')
const APPS_DIR = path.resolve(__dirname, '../', 'apps')
let appModules = {}
let appInfo = {}
let appTypeCache = {}

function loadApps () {
  if (!fs.existsSync(APPS_DIR)) {
    return
  }
  let files = fs.readdirSync(APPS_DIR)
  files.filter(function (file) {
    return fs.statSync(path.join(APPS_DIR, file)).isDirectory()
  }).forEach(function (file) {
    if (!new RegExp('^\\.').test(file)) {
      let module = null
      try {
        module = require(path.join(APPS_DIR, file))
        appModules[file] = module
        let info = require(path.join(APPS_DIR, file, '/package.json'))
        appInfo[file] = info
        appTypeCache[info.learnbitType] = appModules[file]
      } catch (e) {
        log.debug('Ignoring directory', file)
      }
    }
  })
}
loadApps()

;(function (Apps) {
  Apps.list = function () {
    return appInfo || {}
  }

  Apps.reload = function () {
    loadApps()
    return appInfo || {}
  }

  Apps.clear = function () {
    appModules = {}
    appInfo = {}
    return appInfo || {}
  }

  Apps.getInfo = function (name) {
    return appInfo[name] || null
  }

  Apps.get = function (name) {
    return appModules[name]
  }

  Apps.getAll = function () {
    return appModules || {}
  }

  Apps.getForType = function (learnbitType) {
    return appTypeCache[learnbitType] || null
  }
}(exports))
