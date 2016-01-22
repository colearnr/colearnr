var db = require("./db"),
  query = require("./query"),
  log = require("./log"),
  util = require("./util"),
  cloud_lib = require('../lib/cloud'),
  http_utils = require('./http_utils'),
  extract_lib = require("./extract"),
  Step = require('step'),
  _ = require('lodash'),
  YT_URL_PREFIX = 'https://youtu.be/',
  YT_URL_PARSER = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?)|(feature\=player_embedded&))\??v?=?([^#\&\?]*).*/;

function getParam(param, url) {
  param = param.replace(/[\[]/g, "\\\[").replace(/[\]]/g, "\\\]");
  var regexS = "[\\?&]" + param + "=([^&#]*)",
    regex = new RegExp(regexS),
    results = regex.exec(url);
  return ( results == null ) ? "" : results[1].replace(/ /g, '');
}

function create_learn_bit(main_topic, bare_element, callback) {
  var self = this,
    skip = 0,
    topicAdd = false,
    topicFound = false;

  self._val = function(value, default_value) {
    var ret = (!value || value == '') ? default_value : value;
    if (!ret) {
      ret = ''
    }
    return ret;
  };

  self._images = function(be, value) {
    var ilist = [];
    if (be) {
      return [be];
    }
    if (!value || !value.length) {
      return ilist;
    }
    value.forEach(function(arow) {
      ilist.push(arow.url);
    });
    return ilist;
  };

  self._url = function(url, canUrl) {
    var ret = url;
    if (!util.empty(canUrl) && canUrl != url) {
      ret = canUrl;
    }
    return ret;
  };

  self._topic = function(topic, subtopic) {
    if (!topic && !subtopic) {
      return null;
    }
    var topicToUse = topic || '';
    if (subtopic) {
      topicToUse = (topicToUse ? '' : (topicToUse + '/') ) + subtopic;
    }
    var tlist = topicToUse.split('/'),
      name = tlist[tlist.length - 1],
      order = null;
    if (name.indexOf(":") != -1) {
      var tmpArr = name.split(":");
      name = tmpArr[1];
      order = tmpArr[0];
    }
    return {id: util.idify(name), order: order};
  }

  self._gen_yt_url = function(url, bodystr) {
    //    log.log('debug', 'URL INPUT TO FUNCTION : ' , url);
    //    log.log('debug', 'BODYSTRING INPUT TO FUNCTION : ' , bodystr);

    var ret = '';
    if (bodystr) {
      var body = util.parseJson(bodystr);
      //log.log('debug', 'body : ', body);
      ret = YT_URL_PREFIX + body.embed;
    }
    if (url) {
      var match_content = url.match(YT_URL_PARSER);
      if (match_content && match_content[match_content.length - 1].length == 11) {
        ret = YT_URL_PREFIX + match_content[match_content.length - 1];
      }
      else {
        log.log('debug', 'create_learn_bit.js ', 'Youtube parse error : ' + url);
      }
    }

    //   log.log('debug', 'youtube url is ', ret);
    return ret;
  }

  self._gen_title = function(url) {
    if (util.empty(url) || url == '#') {
      return '';
    }
    if (url.indexOf('.flv') != -1 || url.indexOf('.mp4') != -1) {
      return 'Recording';
    }
    var ret = '';
    var tmpA = url.split('/');
    if (tmpA && tmpA.length) {
      ret = tmpA[tmpA.length - 1];
    }
    var extn = util.getExtension(ret);
    if (extn) {
      ret = ret.replace(new RegExp(extn + '$', 'ig'), '');
    }
    ret = decodeURIComponent(ret);
    ret = ret.replace(/[^a-zA-Z 0-9\\.\-\_]+/g, '');
    ret = ret.replace(/[-\_\\.]/g, ' ');
    ret = util.capitalise(ret);
    return ret;
  }

  self._privacy_mode = function(bare_element) {
    if (bare_element.privacy_mode) {
      return bare_element.privacy_mode;
    }
    return (bare_element.author && 'colearnr' == bare_element.author) ? 'public' : 'private'
  }

  self._find_order = function(bare_element, callback) {
    if (bare_element) {
      if (bare_element.order) {
        callback(null, bare_element.order);
      }
      else if (util.validOid(bare_element.topic_oid)) {
        db.learnbits.find({topics: {_id: db.ObjectId('' + bare_element.topic_oid)}, hidden: {$ne: true}}, {order: 1})
          .sort({order: -1}).limit(1, function(err, rows) {
            var row = (rows && rows.length) ? rows[0] : null;
            var order = null;
            if (err || !row) {
              callback(err, null);
            }
            else {
              if (row.order) {
                order = parseInt(row.order, 10) + 1;
              }
              callback(err, order);
            }
          });
      }
    }
    else {
      callback(null, null);
    }
  }

  self._db_update = function(exis_obj, ele, callback) {
    var update_map = {};
    var topicUpdate = false;
    var skipIdFetch = false;
    if (exis_obj.topics && ele.topic_oid) {
      for (var i in exis_obj.topics) {
        if ('' + exis_obj.topics[i]._id == ele.topic_oid) {
          topicFound = true;
        }
      }
      if (!topicFound) {
        var tmptopics = exis_obj['topics'];
        tmptopics.push({_id: db.ObjectId(ele.topic_oid)});
        update_map['topics'] = tmptopics;
        update_map['order'] = null;
        topicAdd = true;
        update_map['last_updated'] = new Date();
      }
    }
    if (!exis_obj.title && ele.title) {
      update_map['title'] = ele.title;
    }
    if (!exis_obj.description && ele.description) {
      update_map['description'] = ele.description;
    }
    if ((!exis_obj.img_url.length && ele['image-url']) || (exis_obj.img_url && ele['image-url'] && exis_obj.img_url[0] != ele['image-url'])) {
      update_map['img_url'] = [ele['image-url']];
    }
    if (!topicAdd && !exis_obj.order && ele.order || (ele.order && exis_obj.order && exis_obj.order != ele.order)) {
      update_map['order'] = ele.order;
    }

    // Update the existing object map with the new contents that can be passed on to the callback
    _.merge(exis_obj, update_map);
    // Update the db, if the learnbit gets assigned to a different topic.
    if (topicAdd && _.size(update_map)) {
      db.learnbits.update(
        {_id: exis_obj._id},
        {$set: update_map},
        function(err) {
          callback(err, exis_obj, true);
          log.log('debug', exis_obj._id, 'updated successfully');
        }
      );
    } else {
      callback(null, exis_obj, topicFound);
    }
  }

  var args = null;
  if (bare_element._id) {
    args = {_id: db.ObjectId('' + bare_element._id)};
  }
  else {
    args = {"url": bare_element.url};
    if (!bare_element.author) {
      bare_element.author = 'colearnr';
    }
    if ((!bare_element.url || bare_element.url == '#') && bare_element.body) {
      args = {"body": bare_element.body};
    }
    if (!topicAdd || !topicFound) {
      args['added_by'] = bare_element.author;
    }
  }

  db.learnbits.find(args, function(err, doc) {
    if (err) {
      log.log('error', err, args);
      callback(err, {});
    }
    else {
      if (doc[0] && (doc[0].url && doc[0].url != '#') && !bare_element._id) {
        log.info(doc[0]._id + " is already present in the db. Checking for update ...");
        self._db_update(doc[0], bare_element, callback);
      }
      else if (bare_element._id && bare_element.topic_oid) {
        if (bare_element._id == doc[0]._id) {
          log.info(doc[0]._id + " is already present in the db. Checking for update ...");
          self._db_update(doc[0], bare_element, callback);
        }
        else {
          db.learnbits.update({_id: db.ObjectId('' + bare_element._id)}, {
            $push: {topics: {_id: db.ObjectId('' + bare_element.topic_oid)}}
          });
          callback(null, doc[0]);
        }
      }
      else if (!util.empty(bare_element.url) || !util.empty(bare_element.body)) {
        extract_lib.extract(bare_element.url, bare_element.body, function(url_data) {
          self._find_order(bare_element, function(err, order) {
            var urlToUse = self._url(bare_element.url, url_data.url),
              body_val = self._body(urlToUse, bare_element, url_data),
              lbit_type = bare_element.type || util.getUrlType(urlToUse, body_val);
            log.log('debug', 'lbit to create', bare_element, order, lbit_type);
            var lb = {
              title: self._val(bare_element.title, url_data.title),
              description: self._val(bare_element.description, url_data.description),
              type: lbit_type,
              url: urlToUse,
              img_url: bare_element.img_url || (self._images(bare_element['image-url'], url_data.images)),
              img_title: self._val(bare_element.title, url_data.title),
              body: body_val,
              source: url_data.provider_url,
              license: '',
              topics: (bare_element.topic_oid) ? bare_element.topic_oid : (self._topic(bare_element['topic'], bare_element['sub-topic'])),
              order: order || (bare_element.order ? parseInt(bare_element.order, 10) : null),
              added_by: bare_element.author || bare_element['author_email'] || 'colearnr',
              privacy_mode: self._privacy_mode(bare_element),
              added_date: new Date(),
              last_updated: new Date(),
              related: url_data.related || [],
              entities: url_data.entities || [],
              tags: util.tagify(url_data.keywords),
              keywords: url_data.keywords,
              safe: (url_data.safe == false) ? false : true,
              moderation_required: false,
              hidden: false,
              size: bare_element.size || null
            };

            if (lbit_type == 'youtube') {
              lb['url'] = self._gen_yt_url(lb['url'], lb['body']);
            }
            if (lbit_type == 'quote') {
              lb['body'] = JSON.stringify({quote: lb['body'].replace(/\"/g, ''), author: ''});
            }
            if (util.empty(lb['title'])) {
              lb['title'] = self._gen_title(lb['url']);
            }

            //log.info(lb);
            var path = bare_element['path'] ? bare_element['path'] : ( ',' + util.idify(main_topic) + ',' + ( bare_element['topic'] ? util.idify(bare_element['topic']) + ',' : '') );
            //log.info("Creating learnbit for " + bare_element.url + " " + path);
            var tlist = bare_element['topic_oid'] ? bare_element['topic_oid'] : (bare_element['sub-topic'] ? bare_element['sub-topic'].split("/") : []);
            var name = tlist[tlist.length - 1];
            if (name.indexOf(":") != -1) {
              var tmpA = name.split(":");
              name = tmpA[1];
            }
            var add_path = '';
            if (tlist.length > 1) {
              for (var i = 0; i < tlist.length - 1; i++) {
                var tmpTopic = tlist[i];
                add_path = add_path + util.idify(tmpTopic) + ',';
              }
            }
            path = path + add_path;
            if (bare_element['topic_oid']) {
              lb['topics'] = [{_id: db.ObjectId(bare_element['topic_oid'])}];
              http_utils.isFrameRestricted(lb['url'], function(err, res) {
                lb['frame_restricted'] = res;
                db.learnbits.save(lb, function(err) {
                  if (err) {
                    log.log('error', 'Error in first save', err, lb);
                  }
                  // Check if this is a stream url. Then sign the url and send it
                  if (util.isStreamUrl(lb.url)) {
                    var surl = cloud_lib.getSignedUrl(lb.url, null);
                    if (surl) {
                      lb.url = surl;
                    }
                  }
                  callback(err, lb);
                });
              });
            }
          }); // _find_order
        }); // extract
      }
      else {
        log.log('info', 'Giving up this lbit', main_topic, bare_element);
        callback(null, {});
      }
    }
  });

  self._body = function(urlToUse, ele, url_data) {
    var url = urlToUse || ele.url;
    var body = ele.body;
    if (!url || url == '#') {
      return body;
    }
    var ret = '';
    var content = url_data.content;
    switch (util.getUrlType(url, body)) {
      case 'youtube':
        var retMap = {};
        var v = '';
        var match_content = url.match(YT_URL_PARSER);
        if (match_content && match_content.length && match_content[match_content.length - 1] && match_content[match_content.length - 1].length == 11) {
          v = match_content[match_content.length - 1];
        }
        else {
          log.log('debug', 'create_learn_bit.js ', 'Youtube parse error : ' + url);
        }
        var start = getParam("start", url);
        var end = getParam("end", url);
        if (!v) {
          log.warn("Unable to find the embed code for youtube video. Please check the url");
          ret = url;
        }
        else {
          retMap['embed'] = v;
          if (start) {
            retMap['start'] = parseInt(start, 10);
          }
          if (end) {
            retMap['end'] = parseInt(end, 10);
          }
        }
        ret = util.stringify(retMap);
        //log.info(ret);
        break;
      case 'vimeo':
        var regExp = /^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/;
        var match = url.match(regExp);
        var retMap = {};
        if (match && match.length) {
          retMap['embed'] = match[5];
        }
        ret = util.stringify(retMap);
        //log.info(ret);
        break;
      case 'slideshare':
        var iframe_html = unescape(url_data.media.html);
        if (!iframe_html) {
          return '';
        }
        var regExp = /http(s?):\/\/(www\.)?slideshare.net\/slideshow\/embed_code\/(\d+)/;
        var match = iframe_html.match(regExp);
        if (match && match.length) {
          var retMap = {};
          retMap['embed'] = match[3];
          ret = util.stringify(retMap);
        }
        else {
          ret = '';
        }
        //log.info(ret);
        break;
      case 'iframe-embed':
        var srcstr = getParam("src", body);
        //console.log("Src", srcstr);
        return body;
      default:
        ret = content;
    } // switch
    //log.info(ret);
    if (ret) {
      ret = ret.replace(/\n/g, '');
    }
    return ret;
  }
}

module.exports = create_learn_bit;
