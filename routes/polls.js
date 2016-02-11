var util = require('../common/util')
var db = require('../common/db')
var constants = require('../common/constants')
var logger = require('../common/log')
var _ = require('lodash')

function view (req, res) {
}

function vote (req, response) {
  var oid = req.body.oid
  var choice = req.body.choice
  var user = req.user || constants.DEMO_USER
  if (util.validOid(oid)) {
    db.learnbits.findOne({_id: db.ObjectId('' + oid)}, function (err, lbit) {
      if (err || !lbit || lbit.type !== 'poll') {
        response.send(500, 'Invalid poll!')
      } else if (lbit.votes && _.indexOf(lbit.votes, user._id) !== -1) {
        response.send(500, 'Looks like you have already voted for this poll!')
      } else {
        var body = lbit.body
        try {
          body = util.parseJson(body)
        } catch (e) {}
        body.choices.forEach(function (achoice) {
          if (achoice && achoice.id === choice) {
            if (!lbit.choice_votes) {
              lbit.choice_votes = {}
            }
            if (!lbit.choice_votes[achoice.id]) {
              lbit.choice_votes[achoice.id] = []
            }
            lbit.choice_votes[achoice.id].push({user: user._id, vote_time: new Date()})
            if (!lbit.votes) {
              lbit.votes = []
            }
            lbit.votes.push(user._id)
          }
        })
        lbit.body = util.stringify(body)
        db.learnbits.save(lbit, function (err, nlbit) {
          if (!err) {
            response.send('1')
          } else {
            logger.log('error', 'Error while casting vote', err, oid, choice)
            response.send(500, 'Unable to cast your vote. Please try after sometime!')
          }
        })
      }
    })
  } else {
    response.send(500, 'Invalid poll!')
  }
}

function create_new (req, response) {
  var topic_oid = req.query.topic_id
  var lbit = {type: 'poll'}
  if (util.validOid(topic_oid)) {
    db.topics.findOne({_id: db.ObjectId(topic_oid)}, function (err, topic) {
      if (err) {
        logger.error(err)
      }
      var topiclist = [{id: topic._id, text: topic.name}]
      var dataMap = {topic: topic, lbit: lbit, topiclist: util.stringify(topiclist)}
      response.render('polls/poll-creator.ejs', dataMap)
    })
  } else {
    var dataMap = {topic: null, lbit: lbit, topiclist: null}
    response.render('polls/poll-creator.ejs', dataMap)
  }
}

exports.view = function (req, res) {
  view(req, res)
}

exports.vote = function (req, res) {
  vote(req, res)
}

exports.create_new = function (req, response) {
  create_new(req, response)
}
