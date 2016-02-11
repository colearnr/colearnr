var _ = require('lodash'),
  sm = require('sitemap'),
  routes = require('./'),
  fs = require('fs'),
  userlib = require('../lib/user'),
  sitemaplib = require('../lib/sitemap'),
  topic = require('./topic'),
  analytics = require('./analytics'),
  lbits = require('./lbits'),
  polls = require('./polls'),
  embed = require('./embed'),
  user = require('./user'),
  helper = require('./helper'),
  pages = require('./pages'),
  config = require('../lib/config').config,
  constants = require('../common/constants'),
  logger = require('../common/log'),
  util = require('../common/util'),
  passlib = require('../lib/pass'),
  userdatalib = require('./userdata'),
  query = require('../common/query'),
  perms = require('../lib/perms'),
  version = require('../version'),
  router_common = require('./router-common'),
  appsRouter = require('./apps-router'),
  search = require('./search'),
  url_utils = require('url'),
  busboy = require('connect-busboy'),
  sitemap = null

module.exports = function (app) {
  var pageOptionsSetter = router_common.pageOptionsSetter
  var sessionOptionsSetter = router_common.sessionOptionsSetter

  app.get('/', pageOptionsSetter, sessionOptionsSetter, routes.index)

  app.get('/ejs/:template', pageOptionsSetter, sessionOptionsSetter, function (req, res) {
    var path = __dirname + '/../views/' + req.params['template']
    if (fs.existsSync(path)) {
      res.send(fs.readFileSync(path))
    } else {
      res.status(404).send('No such template')
    }
  })

  app.get('/ejs/:path/:template', pageOptionsSetter, sessionOptionsSetter, function (req, res) {
    var path = __dirname + '/../views/' + req.params['path'] + '/' + req.params['template']
    if (fs.existsSync(path)) {
      res.send(fs.readFileSync(path))
    } else {
      res.status(404).send('No such template')
    }
  })

  app.get('/socket.io/:num', function (req, res) {
    res.redirect(config.socket_server + '/socket.io/' + req.params['num'] + '?' + req.query.t)
  })

  if (config.enable_search_robots) {
    app.get('/sitemap.xml', function (req, res) {
      sitemaplib.getAllUrls(function (err, sitemapurls) {
        if (!err) {
          sitemap = sm.createSitemap({
            hostname: config.base_url,
            cacheTime: 600000, // 600 sec - cache purge period
            urls: sitemapurls
          })
          res.header('Content-Type', 'application/xml')
          res.send(sitemap.toString())
        }
      })
    })
  }

  app.get('/login', pageOptionsSetter, sessionOptionsSetter, function (req, res) {
    if (req.user && !userlib.isComplete(req.user)) {
      return user.complete_check(req, res)
    }
    // If the user is already logged in, take him straight to the home page
    if (req.isAuthenticated && req.isAuthenticated()) {
      res.redirect(constants.DEFAULT_HOME_PAGE)
      return
    } else {
      res.render('login', {})
    }
  })

  app.get('/register', pageOptionsSetter, sessionOptionsSetter, function (req, res) {
    // If the user is already logged in, take him straight to the home page
    if (req.isAuthenticated && req.isAuthenticated()) {
      res.redirect(constants.DEFAULT_HOME_PAGE)
      return
    } else {
      res.render('login', {mode: 'register'})
    }
  })

  app.get('/loginErrorJson', pageOptionsSetter, sessionOptionsSetter, function (req, res) {
    var message = req.flash('error')
    res.status(403).send({message: message})
  })

  app.post('/login', pageOptionsSetter, sessionOptionsSetter, passlib.passport.authenticate('local', {
    failureRedirect: '/loginErrorJson',
    failureFlash: true
  }), user.handle_login)

  app.post('/register', pageOptionsSetter, sessionOptionsSetter, user.handle_register)

  app.get('/logout', pageOptionsSetter, sessionOptionsSetter, user.logout)

  app.get('/profile/edit', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, function (req, res) {
    user.edit_profile(req, res)
  }
  )

  app.post('/profile/save', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, function (req, res) {
    user.save_profile(req, res)
  })

  app.get('/profile/image', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, function (req, res) {
    res.redirect(req.user.profileImage)
  })

  app.get('/user/topic', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.list_user_topic)

  app.get('/user/learn-map', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.generate_learn_map)

  app.get('/user/searchCollaborators', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, user.searchCollaborators)

  app.get('/user/search', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, user.search)

  app.get('/user/verify/:code', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, user.verify)

  app.get('/user/image/:oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, user.get_profile_image)

  app.post('/user/:oid/media_upload', busboy(), pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, user.media_upload)

  app.post('/password/reset', pageOptionsSetter, sessionOptionsSetter, user.reset_password)

  app.get('/password/change', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, user.show_change_password)

  app.post('/password/change', pageOptionsSetter, sessionOptionsSetter, user.change_password)

  app.get('/branding/load/:page', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, pages.load)

  app.get('/t/map/:oid', pageOptionsSetter, passlib.ensureConditionalAccess, sessionOptionsSetter, topic.load_map)
  app.get('/topic/map/:oid', pageOptionsSetter, passlib.ensureConditionalAccess, sessionOptionsSetter, topic.load_map)

  app.post('/t/map', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.save_map)
  app.post('/topic/map', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.save_map)

  app.get('/t/new', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.create_new)
  app.get('/topic/new', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.create_new)

  app.get('/t/edit/:oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.edit_form)
  app.get('/topic/edit/:oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.edit_form)

  app.get('/t/fulldelete/:oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.delete_topic_full)
  app.get('/topic/fulldelete/:oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.delete_topic_full)

  app.get('/t/delete/:oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.delete_topic)
  app.get('/topic/delete/:oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.delete_topic)

  app.get('/t/undelete/:oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.undelete_topic)
  app.get('/topic/undelete/:oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.undelete_topic)

  app.post('/t/quick_edit', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.save_edit)
  app.post('/topic/quick_edit', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.save_edit)

  app.post('/t/edit', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.save_edit_full)
  app.post('/topic/edit', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.save_edit_full)

  app.get('/t/search', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.search)
  app.get('/topic/search', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.search)

  app.get('/t/follow/:topic_oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.follow)
  app.get('/topic/follow/:topic_oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.follow)

  app.get('/t/users/:topic_oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.list_users)
  app.get('/topic/users/:topic_oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.list_users)

  app.post('/t/users/:topic_oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.save_users)
  app.post('/topic/users/:topic_oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.save_users)

  app.get('/t/:topic_oid', pageOptionsSetter, passlib.ensureConditionalAccess, sessionOptionsSetter, topic.list_by_oid)
  app.get('/topic/:topic_oid', pageOptionsSetter, passlib.ensureConditionalAccess, sessionOptionsSetter, topic.list_by_oid)

  app.get('/t/:topic_oid/:id', pageOptionsSetter, passlib.ensureConditionalAccess, sessionOptionsSetter, topic.list_by_oid)
  app.get('/topic/:topic_oid/:id', pageOptionsSetter, passlib.ensureConditionalAccess, sessionOptionsSetter, topic.list_by_oid)

  app.get('/t/:topic_oid/:id/:sortOrder', pageOptionsSetter, passlib.ensureConditionalAccess, sessionOptionsSetter, topic.list_by_oid)
  app.get('/topic/:topic_oid/:id/:sortOrder', pageOptionsSetter, passlib.ensureConditionalAccess, sessionOptionsSetter, topic.list_by_oid)

  app.post('/t/:oid/media_upload', busboy(), pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.media_upload)
  app.post('/topic/:oid/media_upload', busboy(), pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, topic.media_upload)

  app.get('/l/view/:oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.view)
  app.get('/lbit/view/:oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.view)

  app.get('/m/:oid', pageOptionsSetter, passlib.ensureConditionalAccess, sessionOptionsSetter, lbits.view_media)
  app.get('/media/:oid', pageOptionsSetter, passlib.ensureConditionalAccess, sessionOptionsSetter, lbits.view_media)

  app.get('/l/:oid/media/:fname', pageOptionsSetter, passlib.ensureConditionalAccess, sessionOptionsSetter, lbits.view_lbit_media)
  app.get('/lbit/:oid/media/:fname', pageOptionsSetter, passlib.ensureConditionalAccess, sessionOptionsSetter, lbits.view_lbit_media)

  app.get('/l/tracks/:type/:oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.view_tracks)
  app.get('/lbit/tracks/:type/:oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.view_tracks)

  app.get('/l/embed/:oid', pageOptionsSetter, passlib.ensureConditionalAccess, sessionOptionsSetter, embed.embed_lbit)
  app.get('/lbit/embed/:oid', pageOptionsSetter, passlib.ensureConditionalAccess, sessionOptionsSetter, embed.embed_lbit)

  app.get('/l/download/:oid', pageOptionsSetter, passlib.ensureConditionalAccess, sessionOptionsSetter, lbits.download)
  app.get('/lbit/download/:oid', pageOptionsSetter, passlib.ensureConditionalAccess, sessionOptionsSetter, lbits.download)

  app.post('/l/upload', busboy(), pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.upload)
  app.post('/lbit/upload', busboy(), pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.upload)

  app.post('/l/:oid/media_upload', busboy(), pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.media_upload)
  app.post('/lbit/:oid/media_upload', busboy(), pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.media_upload)

  app.get('/l/optimise/:oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.optimise)
  app.get('/lbit/optimise/:oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.optimise)

  app.get('/l/edit/:oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.edit_form)
  app.get('/lbit/edit/:oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.edit_form)

  app.post('/l/edit', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.save_edit_full)
  app.post('/lbit/edit', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.save_edit_full)

  app.get('/l/new', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.create_new)
  app.get('/lbit/new', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.create_new)

  app.get('/l/like', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.like)
  app.get('/lbit/like', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.like)

  app.get('/l/new/topic/:topic_oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.create_new)
  app.get('/lbit/new/topic/:topic_oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.create_new)

  app.post('/l/quick_edit', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.save_edit)
  app.post('/lbit/quick_edit', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.save_edit)

  app.post('/l/delete', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.del_lbit)
  app.post('/lbit/delete', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.del_lbit)

  app.post('/l/add', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.save_lbit_url)
  app.post('/lbit/add', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.save_lbit_url)

  app.get('/l/search', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.search)
  app.get('/lbit/search', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.search)

  app.get('/poll/new', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, polls.create_new)

  app.get('/poll/new/topic/:topic_oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, polls.create_new)

  app.get('/poll/view/:oid', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, polls.view)

  app.post('/poll/vote', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, polls.vote)

  app.get('/r/:oid/:type', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, lbits.redirect_url)

  app.get('/userdata/:lbit_oid/annotations', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, userdatalib.list_annotations)

  app.get('/userdata/:lbit_oid/search', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, userdatalib.search_annotations)

  app.post('/userdata/:lbit_oid/annotations', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, userdatalib.save_annotations)

  app.put('/userdata/:lbit_oid/annotations', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, userdatalib.update_annotations)

  app.delete('/userdata/:lbit_oid/annotations', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, userdatalib.delete_annotations)

  app.put('/userdata/:lbit_oid/annotations/:id', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, userdatalib.update_annotations)

  app.delete('/userdata/:lbit_oid/annotations/:id', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, userdatalib.delete_annotations)

  app.get('/userdata/:lbit_oid/notes', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, userdatalib.list_notes)

  app.post('/userdata/:lbit_oid/notes/:id', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, userdatalib.save_notes)

  app.get('/apps/reload', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, function (req, res) {
    perms.isAdmin(req.user, function (err, isAdmin) {
      if (isAdmin) {
        appsRouter.addAppRoutes(app, constants.APP_PREFIX, [pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter])
        res.send('success')
      } else {
        res.status(500).send('Not allowed')
      }
    })
  })

  // Routes for apps
  appsRouter.addAppRoutes(app, constants.APP_PREFIX, [pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter])

  app.get('/search', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, search.search_all)

  app.post('/search/save', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, search.save_search)

  app.get('/embed', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, embed.embed_url)

  app.get('/proxy', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, embed.proxy_url)

  app.post('/complete', pageOptionsSetter, passlib.ensureAuthenticated, sessionOptionsSetter, user.complete)

  app.get('/video/position', analytics.get_video_last_position)

  app.get('/pdf/position', analytics.get_pdf_last_position)

  app.get('/yt_track', analytics.youtube_track)

  app.get('/vim_track', analytics.vimeo_track)

  app.get('/ss_track', analytics.slideshare_track)

  app.get('/vid_track', analytics.video_track)

  app.get('/pdf_track', analytics.pdf_track)

  app.get('/topic_track', analytics.topic_track)

  app.get('/lbit_track', analytics.lbit_track)

  app.get('/tour', helper.site_tour)

  app.get('/success', helper.success)

  app.get('/tour-finish', helper.site_tour_finish)

  app.get('/:topicname', pageOptionsSetter, passlib.ensureConditionalAccess, sessionOptionsSetter, topic.list_category)

  app.get('/:parent_category/:topicname', pageOptionsSetter, passlib.ensureConditionalAccess, sessionOptionsSetter, topic.list)
}
