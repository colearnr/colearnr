'use strict'

const config_lib = require('../lib/config')
const query = require('../common/query')
const version = require('../version')
const constants = require('../common/constants')
const util = require('../common/util')
const _ = require('lodash')
const learnApps = require('../lib/apps')
const urlUtils = require('url')
const MobileDetect = require('mobile-detect')
const perms = require('../lib/perms')

function pageOptionsSetter (req, res, next) {
  // logger.log('debug', 'page options set')
  let page_options = {}
  let url = req.url
  let origUrl = req.headers.referer || req.originalUrl
  let embedMode = false
  let urlObj = urlUtils.parse(origUrl)
  if (req.headers && req.headers['accept-encoding'] && req.headers['accept-encoding'].indexOf('gzip') !== -1) {
    page_options.gzip_enabled = true
  }
  if (urlObj.pathname === '/embed') {
    embedMode = true
  } else if (url.indexOf('embedMode=true') !== -1 || url.indexOf('embedMode=1') !== -1 || origUrl.indexOf('embedMode=true') !== -1 || origUrl.indexOf('embedMode=1') !== -1 || origUrl.indexOf('embedSize=') !== -1) {
    embedMode = true
  }
  let hostname = req.headers['host'] ? req.headers['host'].split(':')[0] : '127.0.0.1'
  let config = config_lib.config.use_client_host ? config_lib.configure(hostname) : config_lib.config
  page_options.cdn_prefix = config.cdn_prefix
  page_options.version = version
  page_options.env = process.env
  res.locals.page_options = page_options
  res.locals.req = req
  res.locals.res = res
  res.locals.util = util
  res.locals.perms = perms
  res.locals.embedMode = embedMode
  res.locals.config = config
  res.locals.constants = constants
  res.locals._ = _
  let durl = config.socket.address + ((config.socket.port !== 80 && config.socket.port !== 443) ? ':' + config.socket.port : '')
  let host_url = config.base_url + (config.use_port ? (':' + config.port) : '')
  res.locals.durl = durl
  res.locals.host_url = host_url
  let md = new MobileDetect(req.headers['user-agent'])
  res.locals.isMobile = md.mobile()
  res.locals.isPhone = md.phone()
  res.locals.isTablet = md.tablet()
  if (!config.use_client_host) {
    res.locals.host_url_https = host_url.replace('http://', 'https://')
    res.locals.host_url_http = host_url.replace('https://', 'http://')
  }
  res.locals.apps = learnApps.list()
  next()
}

function sessionOptionsSetter (req, res, next) {
  res.locals.user = req.user
  if (req.isAuthenticated && req.isAuthenticated() && req.session) {
    res.locals.session = req.session
    let returnTo = util.getReturnToUrl(req)
    res.locals.returnTo = req.session.returnTo = returnTo
    req.session.push = function (data) {
      let array = req.session.recently_visited_topics || []
      for (let i in array) {
        if (array[i]._id === data._id) {
          array.splice(i, 1)
          break
        }
      }
      array.push(data)
      req.session.recently_visited_topics = array.slice(-5).reverse()
    }
  }

  query.get_random_topics(req.user, constants.LEARN_TOPICS_COUNT, function (err, data) {
    if (!err && data) {
      res.locals.random_topics = data
    }
    next()
  })
}

exports.pageOptionsSetter = pageOptionsSetter
exports.sessionOptionsSetter = sessionOptionsSetter
