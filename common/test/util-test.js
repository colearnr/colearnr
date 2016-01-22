var vows = require('vows'),
  _ = require('lodash'),
  config = require('../../lib/config').config,
  constants = require('../constants'),
  should = require('should'),
  db = require('../db'),
  util = require('../util');

vows.describe('util').addBatch({
  'When using the util module': {
    'to capitalise word': {
      topic: util.capitalise('hello'),
      'should become Hello': function(topic) {
        topic.should.equal('Hello');
      }
    },

    'to capitalise phrase': {
      topic: util.capitalise('hello world from universe'),
      'should become Hello World From Universe': function(topic) {
        topic.should.equal('Hello World From Universe');
      }
    },

    'to capitalise phrase with articles': {
      topic: util.capitalise('hello world for universe'),
      'should become Hello World for Universe': function(topic) {
        topic.should.equal('Hello World for Universe');
      }
    },

    'to trim strings at the end': {
      topic: util.trim('Hello world with space at the end  '),
      'should not have space at the end': function(topic) {
        topic.should.equal('Hello world with space at the end');
      }
    },

    'to trim strings at the front': {
      topic: util.trim('  Hello world with space at the front\n'),
      'should not have space at the front': function(topic) {
        topic.should.equal('Hello world with space at the front');
      }
    },

    'to trim strings on both sides': {
      topic: util.trim('  Hello world with space at both end   '),
      'should not have space at the front': function(topic) {
        topic.should.equal('Hello world with space at both end');
      }
    },

    'to test if topic url': {
      topic: util.getTopicFromUrl('http://localhost:8080/topic/5292a88d5b66ad0000000001/new-topic'),
      'topic id check': function(topic) {
        topic.should.eql({oid: '5292a88d5b66ad0000000001', id: 'new-topic', type: 'topic'});
      }
    },

    'to test if topic url2': {
      topic: util.getTopicFromUrl('http://localhost:8080/topic/5292a88d5b66ad0000000001'),
      'topic id check': function(topic) {
        topic.should.eql({oid: '5292a88d5b66ad0000000001', type: 'topic'});
      }
    },

    'to test if topic url3': {
      topic: util.getTopicFromUrl('http://localhost:8080/topic/5292a88d5b66ad0000000001/new-topic/recent'),
      'topic id check': function(topic) {
        topic.should.eql({oid: '5292a88d5b66ad0000000001', id: 'new-topic', sortOrder: 'recent', type: 'topic'});
      }
    },

    'to test if topic url4': {
      topic: util.getTopicFromUrl('http://localhost:8080/topic/map/5292a88d5b66ad0000000001'),
      'topic id check': function(topic) {
        topic.should.eql({oid: '5292a88d5b66ad0000000001', type: 'map'});
      }
    },

    'to test if lbit url pattern work': {
      topic: util.getLbitFromUrl('http://localhost:8080/lbit/view/528679ad6b9d27e82000001b?iframe=true&width=80%&height=90%'),
      'topic id check': function(lbit) {
        lbit.should.eql({_id: '528679ad6b9d27e82000001b'});
      }
    },

    'empty checks': {
      topic: function() {
        var ret = [];
        [null, undefined, '', {}, [], ' ', 'Hello world', new Date(), function() {
        }].forEach(function(v) {
          ret.push(util.empty(v));
        });
        return ret;
      },
      'pass empty checks': function(topic) {
        topic.should.eql([true, true, true, true, true, true, false, false, false]);
      }
    },

    'test url types': {
      topic: function() {
        var ret = [];
        ['http://www.hstalks.com/main/view_talk.php?t=1976&r=529&j=755&c=252', 'http://youtube.com/watch?v=3Untr17W9pw'].forEach(function(v) {
          ret.push(util.getUrlType(v, null));
        });
        return ret;
      },
      'pass checks': function(topic) {
        topic.should.eql(['hstalks', 'youtube']);
      }
    },

    'url checks': {
      topic: function() {
        var ret = [];
        ['http://www.colearnr.com', 'https://www.colearnr.com', 'https://colearnr.com', 'http://colearnr', 'http://ielol.samba.colearnr.com', 'colearnr', 'http:/colearnr', 'about:blank', 'www.colearnr.com', 'rtmp://colearnr.com'].forEach(function(v) {
          ret.push(util.validUrl(v));
        });
        return ret;
      },
      'pass valid url checks': function(topic) {
        topic.should.eql([true, true, true, true, true, false, false, false, true, true]);
      }
    },

    'format path checks': {
      topic: function() {
        var ret = [];
        ['', null, 'a,b,c', ',a,c,d,', ',x,y,z,1'].forEach(function(v) {
          ret.push(util.formatPath(v));
        });
        return ret;
      },
      'pass format path checks': function(topic) {
        topic.should.eql(['', null, 'a/b/c', 'a/c/d', 'x/y/z/1']);
      }
    },

    'idify tests': {
      topic: function() {
        var ret = [];
        ['Week 1', 'Week 1 (great)', 'Week', 'Week 1+Week 2', 'Week 1 (July 14 - Aug 21st 2014)', 'hello:world-that\'s terrible + and works well with http://www.colearnr.com', 'topic 1,2,3,4:10%$£@§±', 'Hello` world, I\'m greater > than <everyone>'].forEach(function(v) {
          ret.push(util.idify(v));
        });
        return ret;
      },
      'checks': function(topic) {
        topic.should.eql(['week-1', 'week-1-great', 'week', 'week-1-week-2', 'week-1-july-14---aug-21st-2014', 'hello-world-thats-terrible---and-works-well-with-http-www-colearnr-com', 'topic-1234-10', 'hello-world-im-greater--than-everyone']);
      }
    },

    'idify tests2': {
      topic: function() {
        var ret = [];
        ['Week 1: How do students find educational games', 'Week 2: How do we evaluate educational games', 'As a class we develop a list of what criteria we should use to define Best/worst games', 'Each group develops a list of what makes for Best/Worst Games (add to collective wordle)', 'A table of best/worst games and why by Stake holder', 'Does criteria depend on the type of stakeholder? If so why', 'What would happen if we interviewed different people or missed some key stakeholders?', 'a picture to represent the process of picking a game or who REALLY decides (task analysis/ stakeholder analysis', 'Interview stakeholders on how they find games & what are the BEST/WORST Games '].forEach(function(v) {
          ret.push(util.idify(v));
        });
        return ret;
      },
      'checks': function(topic) {
        topic.should.eql(['week-1--how-do-students-find-educational-games',
          'week-2--how-do-we-evaluate-educational-games',
          'as-a-class-we-develop-a-list-of-what-criteria-we-should-use-to-define-bestworst-games',
          'each-group-develops-a-list-of-what-makes-for-bestworst-games-add-to-collective-wordle',
          'a-table-of-bestworst-games-and-why-by-stake-holder',
          'does-criteria-depend-on-the-type-of-stakeholder-if-so-why',
          'what-would-happen-if-we-interviewed-different-people-or-missed-some-key-stakeholders',
          'a-picture-to-represent-the-process-of-picking-a-game-or-who-really-decides-task-analysis-stakeholder-analysis',
          'interview-stakeholders-on-how-they-find-games--what-are-the-bestworst-games-']);
      }
    },

    'pathify tests': {
      topic: function() {
        var ret = [];
        ['', 'hello', ',hello,'].forEach(function(v) {
          ret.push(util.pathify(v));
        });
        return ret;
      },
      'checks': function(topic) {
        topic.should.eql([null, ',hello,', ',hello,']);
      }
    },

    'purify tests': {
      topic: function() {
        var ret = [];
        ['', 'hello', ',hello,', 'a_+b/c=e', 'sample ??, hello, -éééé.docx'].forEach(function(v) {
          ret.push(util.purify(v));
        });
        return ret;
      },
      'checks': function(topic) {
        topic.should.eql(['', 'hello', 'hello', 'a_bce', 'sample--hello--.docx']);
      }
    },

    'valid oid tests': {
      topic: function() {
        var ret = [];
        ['', '53b713873edefe3656000001', '53b484a93b81150000000007'].forEach(function(v) {
          ret.push(util.validOid(v));
        });
        return ret;
      },
      'checks': function(topic) {
        topic.should.eql([false, true, true]);
      }
    },

    'quote regex tests': {
      topic: function() {
        var ret = [];
        ['c++'].forEach(function(v) {
          ret.push(util.quote_regex(v));
        });
        return ret;
      },
      'checks': function(topic) {
        topic.should.eql(['c\\+\\+']);
      }
    },

    'has symbol test': {
      topic: function() {
        var ret = [];
        ['c++', 'apple', 'a**b', 'a,b', 'a-b-c', 'a||$@%$£', 'a\\b'].forEach(function(v) {
          ret.push(util.hasInvalidSymbol(v));
        });
        return ret;
      },
      'checks': function(topic) {
        topic.should.eql([false, false, true, false, false, true, true]);
      }
    },

    'Get parents test': {
      topic: util.getParents('online-learning', ',education,'),
      'checks': function(topic) {
        topic.should.have.length(1);
        topic.should.eql([{id: 'education', path: null}]);
      }
    },

    'create hash test': {
      topic: function() {
        var ret = [];
        ['prabhu@colearnr.com'].forEach(function(v) {
          ret.push(util.create_hash(v));
        });
        return ret;
      },
      'checks': function(topic) {
        topic.should.eql(['1c474c1abb4403fb6c27eefeb3c775aa']);
      }
    },

    'Get parents test 2': {
      topic: util.getParents('tel', ',education,online-learning,moocs,'),
      'checks': function(topic) {
        topic.should.have.length(3);
        topic.should.eql([{id: 'education', path: null},
          {id: 'online-learning', path: ',education,'},
          {id: 'moocs', path: ',education,online-learning,'}]);
      }
    },

    'Path to list test': {
      topic: util.path_to_list(['hello', 'hello,world', 'hello,world,prabhu'], {
        'hello|hello': '1',
        'hello,world|world': '200',
        'hello,world,prabhu|prabhu': '300'
      }),
      'checks': function(topic) {
        topic.should.eql([{
          name: 'hello',
          oid: '1',
          children: [{name: 'world', oid: '200', children: [{name: 'prabhu', oid: '300', children: []}]}]
        }]);
      }
    },

    'Split Path test': {
      topic: function() {
        var ret = [];
        [',a,b,c,', 'c', ',a,', null, ',first-topic,topic-2-1,topic-2-1-2,'].forEach(function(v) {
          ret.push(util.split_path(v))
        });
        return ret;
      },
      'checks': function(topic) {
        topic.should.eql([{path: ',a,b,', id: 'c'}, {path: null, id: 'c'}, {
          path: null,
          id: 'a'
        }, null, {path: ',first-topic,topic-2-1,', id: 'topic-2-1-2'}]);
      }
    },

    'convert links test': {
      topic: function() {
        var ret = [];
        [
          [{'_id': '521e717d26fffac0350a3f3a'}],
          [{'_id': '521e717d26fffac0350a3f3a'}, {'path': ',mathematics,abstract-algebra,'}],
          [{'path': ',mathematics,abstract-algebra,'}],
          [{'_id': '521e717d26fffac0350a3f3a'}, {'_id': '51eee8d4c9c2700a05000003'}],
          [{'path': ',mathematics,abstract-algebra,'}, {'path': ',entrepreneurship,centre-for-entrepreneurial-learning,'}],
        ].forEach(function(v) {
            ret.push(util.convert_links(v))
          });
        return ret;
      },
      'checks': function(topic) {
        topic.should.eql([
          {'_id': {'$in': [db.ObjectId('521e717d26fffac0350a3f3a')]}},
          {
            '$or': [{'_id': {'$in': [db.ObjectId('521e717d26fffac0350a3f3a')]}}, {
              'path': ',mathematics,',
              'id': 'abstract-algebra'
            }]
          },
          {'$or': [{'path': ',mathematics,', 'id': 'abstract-algebra'}]},
          {'_id': {'$in': [db.ObjectId('521e717d26fffac0350a3f3a'), db.ObjectId('51eee8d4c9c2700a05000003')]}},
          {
            '$or': [{'path': ',mathematics,', 'id': 'abstract-algebra'}, {
              'path': ',entrepreneurship,',
              'id': 'centre-for-entrepreneurial-learning'
            }]
          }
        ]);
      }
    },

    'webvtt test': {
      topic: function() {
        var ret = [];
        [
          [{time: 10, text: 'chapter 1'}, {time: 20, text: 'chapter 2'}],
          [{time: 10, text: 'chapter 1'}, {time: 20, text: 'chapter 2'}, {time: 35, text: 'chapter 3'}, {
            time: 50,
            text: 'chapter 4'
          }]
        ].forEach(function(v) {
            ret.push(util.createWebVTT(v, 50))
          });
        return ret;
      },
      'checks': function(topic) {
        topic.should.eql([
          'WEBVTT\n\n00:10.000 --> 00:20.000\nchapter 1\n\n00:20.000 --> 00:50.000\nchapter 2\n',
          'WEBVTT\n\n00:10.000 --> 00:20.000\nchapter 1\n\n00:20.000 --> 00:35.000\nchapter 2\n\n00:35.000 --> 00:50.000\nchapter 3\n\n00:50.000 --> 00:50.000\nchapter 4\n'
        ]);
      }
    },

    'getReturnToUrl function': {
      'when referer is colearnr.com/login': {
        topic: util.getReturnToUrl({
          session: null,
          headers: {referer: 'http://www.' + config.cookieDomain + '/' + constants.LOGIN_PAGE}
        }),
        'should return default page': function(topic) {
          topic.should.eql(constants.DEFAULT_HOME_PAGE);
        }
      },
      'when referer is colearnr.com/register': {
        topic: util.getReturnToUrl({
          session: null,
          headers: {referer: 'http://www.' + config.cookieDomain + '/' + constants.REGISTER_PAGE}
        }),
        'should return default page': function(topic) {
          topic.should.eql(constants.DEFAULT_HOME_PAGE);
        }
      },
      'when referer is colearnr.com/auth': {
        topic: util.getReturnToUrl({
          session: null,
          headers: {referer: 'http://www.' + config.cookieDomain + '/' + constants.AUTH_PAGE}
        }),
        'should return default page': function(topic) {
          topic.should.eql(constants.DEFAULT_HOME_PAGE);
        }
      },
      'when referer is colearnr.com/': {
        topic: util.getReturnToUrl({session: null, headers: {referer: 'http://www.' + config.cookieDomain + '/'}}),
        'should return default page': function(topic) {
          topic.should.eql(constants.DEFAULT_HOME_PAGE);
        }
      },
      'when referer is outside colearnr cookie domain (i.e. http://news.bbc.co.uk)': {
        topic: util.getReturnToUrl({session: null, headers: {referer: 'http://news.bbc.co.uk' + '/'}}),
        'should return default page': function(topic) {
          topic.should.eql(constants.DEFAULT_HOME_PAGE);
        }
      },
      'when referer is a topic': {
        topic: util.getReturnToUrl({
          session: null,
          headers: {referer: 'http://www.' + config.cookieDomain + '/leadership'}
        }),
        'should return that topic': function(topic) {
          topic.should.eql('/user/topic');
        }
      }
    }
  }
}).export(module);
