var config = require('../lib/config').config,
  perms = require('../lib/perms'),
  query = require('../common/query'),
  constants = require('../common/constants'),
  _ = require('lodash'),
  logger = require('../common/log'),
  LRU = require('lru-cache'),
  options = {
    max: 50, maxAge: 1000 * 10
  },
  cache = LRU(options),
  elasticsearchHosts = config.es || 'localhost',
  elasticsearch = require('elasticsearch'),
  client = new elasticsearch.Client({
    hosts: elasticsearchHosts,
    sniffOnStart: true,
    sniffInterval: 60000,
    maxRetries: 5
  });

function getClientSuffix() {
  if (config.es_index_suffix) {
    return '-' + config.es_index_suffix;
  }
  return (process.env.ENV_CONFIG ? ('-' + process.env.ENV_CONFIG) : '');
}

client.countLearnbits = function(data, callback) {
  var cparams = {
    index: 'learnbitsindex' + getClientSuffix(),
    type: 'learnbits'
  };
  getTopicList(data, 'topics.', function(err, topicList) {
    cparams.body = getLearnbitsQueryObject(data, topicList);
    client.count(cparams).then(function(resp) {
      callback(null, resp);
    }, function(err) {
      callback(err);
    });
  });
}

client.findLearnbits = function(data, count, callback) {
  //logger.debug('Querying index', 'learnbitsindex' + getClientSuffix());
  if (data.autoComplete) {
    count = constants.AUTO_COMPLETE_COUNT;
  }
  var fromIndex = 0;
  if (data.pg && data.pgSize) {
    fromIndex = (data.pg - 1) * data.pgSize;
  }
  var searchParams = {
    index: 'learnbitsindex' + getClientSuffix(),
    type: 'learnbits',
    from: fromIndex,
    size: count,
    stats: true
  };
  if (!data.autoComplete) {
    searchParams.suggestField = 'title';
    searchParams.suggestMode = 'missing';
    searchParams.suggestSize = constants.SUGGEST_COUNT;
    searchParams.suggestText = data.query;
  }
  getTopicList(data, 'topics.', function(err, topicList) {
    searchParams.body = getLearnbitsQueryObject(data, topicList);
    client.search(searchParams).then(function(resp) {
      if (data.autoComplete) {
        callback(null, resp.hits.hits);
      } else {
        callback(null, resp);
      }
    }, function(err) {
      callback(err);
    });
  });
};

client.findTopics = function(data, count, callback) {
  //logger.debug('Querying index', 'topicsindex' + getClientSuffix());
  if (data.autoComplete) {
    count = constants.AUTO_COMPLETE_COUNT;
  }
  var fromIndex = 0;
  if (data.pg && data.pgSize) {
    fromIndex = (data.pg - 1) * data.pgSize;
  }
  var searchParams = {
    index: 'topicsindex' + getClientSuffix(),
    type: 'topics',
    from: fromIndex,
    size: count,
    stats: true
  };
  if (!data.autoComplete) {
    searchParams.suggestField = 'name';
    searchParams.suggestMode = 'missing';
    searchParams.suggestSize = constants.SUGGEST_COUNT;
    searchParams.suggestText = data.query;
  }
  getTopicList(data, '', function(err, topicList) {
    searchParams.body = getTopicsQueryObject(data, topicList);
    client.search(searchParams).then(function(resp) {
      if (data.autoComplete) {
        callback(null, resp.hits.hits);
      } else {
        callback(null, resp);
      }
    }, function(err) {
      callback(err);
    });
  });
};

client.findUsers = function(data, count, callback) {
  //logger.debug('Querying index', 'usersindex' + getClientSuffix());
  if (data.autoComplete) {
    count = constants.AUTO_COMPLETE_COUNT;
  }
  var fromIndex = 0;
  if (data.pg && data.pgSize) {
    fromIndex = (data.pg - 1) * data.pgSize;
  }
  var searchParams = {
    body: getUsersQueryObject(data),
    index: 'usersindex' + getClientSuffix(),
    type: 'users',
    from: fromIndex,
    size: count,
    stats: true
  };
  if (!data.autoComplete) {
    searchParams.suggestField = 'displayName';
    searchParams.suggestMode = 'missing';
    searchParams.suggestSize = constants.SUGGEST_COUNT;
    searchParams.suggestText = data.query;
  }
  client.search(searchParams).then(function(resp) {
    if (data.autoComplete) {
      callback(null, resp.hits.hits);
    } else {
      callback(null, resp);
    }
  }, function(err) {
    callback(err);
  });
};

function getTopicList(data, prefix, callback) {
  var user = data.user;
  perms.isAllTopicAdmin(user, function(err, isAdmin) {
    if (isAdmin) {
      callback(null, {user: user, isAdmin: isAdmin, topicList: null});
      return;
    }
    var topicList = cache.get('topicList-' + prefix + user._id);
    if (topicList && topicList.length) {
      callback(null, {user: user, isAdmin: isAdmin, topicList: topicList});
    } else {
      topicList = [];
      /*
      query.get_user_all_topics(data.user, function(err, topicsMap) {
        if (err || !topicsMap) {
          callback(err, {user: user, isAdmin: isAdmin, topicList: topicList});
        }
        else {
          var topics = topicsMap['own_topics'] || [],
            collab_topics = topicsMap['collab_topics'] || [],
            colearnr_topics = topicsMap['colearnr_topics'] || [],
            followed_topics = topicsMap['followed_topics'] || [],
            termKey = prefix + '_id';
          collab_topics.forEach(function(atopic) {
            if (atopic && atopic._id) {
              var tmap = {};
              tmap[termKey] = atopic._id;
              topicList.push({'term': tmap});
            }
          });
          colearnr_topics.forEach(function(atopic) {
            if (atopic && atopic._id) {
              var tmap = {};
              tmap[termKey] = atopic._id;
              topicList.push({'term': tmap});
            }
          });
          followed_topics.forEach(function(atopic) {
            if (atopic && atopic._id) {
              var tmap = {};
              tmap[termKey] = atopic._id;
              topicList.push({'term': tmap});
            }
          });
          cache.set('topicList-' + prefix + data.user._id, topicList);
          callback(err, {user: user, isAdmin: isAdmin, topicList: topicList});
        }
      });
      */
      query.get_topics(null, { $or: [{ added_by: data.user },
        { collaborators: data.user },
        { followers: data.user },
        { privacy_mode: 'public' }
        ]}, false, function (err, topics) {
        if (err || !topics) {
          callback(err, { user: user, isAdmin: isAdmin, topicList: topicList });
        }
        else {
          var termKey = prefix + '_id';
          topics.forEach(function(atopic) {
            if (atopic && atopic._id) {
              var tmap = {};
              tmap[termKey] = atopic._id;
              topicList.push({'term': tmap});
            }
          });
          cache.set('topicList-' + prefix + data.user._id, topicList);
          callback(err, {user: user, isAdmin: isAdmin, topicList: topicList});
        }
      });
    }
  });
}

function getLearnbitsQueryObject(data, dataMap) {
  var topicList = dataMap.topicList,
    shouldList = null;
  if (!dataMap.isAdmin) {
    shouldList = [];
    if (data.user && !data.user.guestMode) {
      shouldList.push({'term': {'added_by': data.user._id}});
      shouldList.push({'term': {'added_by': 'colearnr'}});
      if (topicList) {
        shouldList = _.union(shouldList, topicList);
      }
    }
  }

  var boolMap = {
    "must_not": [
      {"missing": {"field": "topics"}}
    ]
  };
  if (shouldList) {
    boolMap['should'] = shouldList;
  }
  var fieldsList = ["title^4"];
  if (!data.autoComplete) {
    fieldsList = _.union(fieldsList, ["description", "tags^2", "body"]);
  }
  if (data.query.indexOf(':') !== -1 && !data.fieldsFilter) {
    var tmpA = data.query.split(':');
    data.fieldsFilter = tmpA[0].split('|');
    data.query = tmpA[1];
  }
  if (data.fieldsFilter && data.fieldsFilter.length) {
    fieldsList = data.fieldsFilter;
  }
  var queryObj = {
    "query": {
      "filtered": {
        "query": {
          "multi_match": {
            "query": data.query,
            "type": "phrase_prefix",
            "fields": fieldsList
          }
        },
        "filter": {
          "bool": boolMap
        }
      }
    },
    "highlight": {
      "fields" : {
        "title" : {},
        "description": {}
      }
    }
  };

  return queryObj;
}

function getTopicsQueryObject(data, dataMap) {
  var topicList = dataMap.topicList,
    shouldList = [];
  if (!dataMap.isAdmin) {
    shouldList.push({'term': {'privacy_mode': 'public'}});
    if (data.user && !data.user.guestMode) {
      shouldList.push({'term': {'added_by': data.user._id}});
      if (topicList) {
        shouldList = _.union(shouldList, topicList);
      }
    }
  }

  var boolMap = {
  };
  if (shouldList && shouldList.length) {
    boolMap['should'] = shouldList;
  }
  var fieldsList = ["name^4"];
  if (!data.autoComplete) {
    fieldsList = _.union(fieldsList, ["description", "tags^2", "body"]);
  }
  if (data.query.indexOf(':') !== -1 && !data.fieldsFilter) {
    var tmpA = data.query.split(':');
    data.fieldsFilter = tmpA[0].split('|');
    data.query = tmpA[1];
  }
  if (data.fieldsFilter && data.fieldsFilter.length) {
    fieldsList = data.fieldsFilter;
  }
  var queryObj = {
    "query": {
      "filtered": {
        "query": {
          "multi_match": {
            "query": data.query,
            "type": "phrase_prefix",
            "fields": fieldsList
          }
        },
        "filter": {
          "bool": boolMap
        }
      }
    },
    "highlight": {
      "fields" : {
        "name" : {},
        "description": {}
      }
    }
  };

  //console.log(JSON.stringify(queryObj));
  return queryObj;
}

function getUsersQueryObject(data) {
  var fieldsList = ["name.first", "name.middle", "name.last", "displayName", "emails"];
  if (data.query.indexOf(':') !== -1 && !data.fieldsFilter) {
    var tmpA = data.query.split(':');
    data.fieldsFilter = tmpA[0].split('|');
    data.query = tmpA[1];
  }
  if (data.fieldsFilter && data.fieldsFilter.length) {
    fieldsList = data.fieldsFilter;
  }
  var queryObj = {
    "query": {
      "filtered": {
        "query": {
          "multi_match": {
            "query": data.query,
            "type": "phrase_prefix",
            "fields": fieldsList
          }
        }
      }
    },
    "highlight": {
      "fields" : {
        "name.first" : {},
        "name.last": {},
        "emails": {}
      }
    }
  };

  //console.log(JSON.stringify(queryObj));
  return queryObj;
}

module.exports = client;
