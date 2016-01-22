var topic = require('./topic'),
  lbits = require('./lbits'),
  user = require('./user'),
  talk = require('./talk'),
  config = require('../lib/config').config,
  request = require('request'),
  passlib = require('../lib/pass');

module.exports = function(app) {

  // Topic api
  app.get('/api/topic/map/:oid', passlib.ensureAuthenticated, topic.load_map_api);
  app.get('/api/topic/search', passlib.ensureAuthenticated, topic.search_api);
  app.get('/api/topic/quicksearch', passlib.ensureAuthenticated, topic.quicksearch);

  // lbit api
  app.get('/api/lbit/search', passlib.ensureAuthenticated, lbits.search_api);

  // user api
  app.get('/api/user/search', passlib.ensureAuthenticated, user.search_api);
  app.get('/api/user/quicksearch', passlib.ensureAuthenticated, user.quicksearch);

  // talk related api
  app.get('/api/user/auth/check_password', passlib.ensureInternalAccess, talk.check_password);
  app.get('/api/user/auth/user_exists', passlib.ensureInternalAccess, talk.user_exists);

  app.get('/api/chat/search', passlib.ensureAuthenticated, user.chat_search_api);
  app.get('/api/chat/image/:id', passlib.ensureAuthenticated, user.get_chat_image);

  if (config.chat_enabled) {
    app.all('/chat/http-bind', function(req, res) {
      var url = config.chat_bosh_server;
      if(req.method == "GET") {
        request.get(url).pipe(res);
      } else {
        request[req.method.toLowerCase()]({url: url, json: req.body}).pipe(res);
      }
    });
  }
}
