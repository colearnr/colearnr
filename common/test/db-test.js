'use strict'

process.env.MONGO_DB_NAME = 'int-test'

let vows = require('vows')
let should = require('should')
let db = require('../db')
let query = require('../query')

function setupTestDb () {
  db.topics.remove()
  db.topics.dropIndexes()
  db.learnbits.remove()
  db.learnbits.dropIndexes()

  db.topics.insert({
    name: 'Lean Startups',
    short_name: 'lean',
    id: 'lean-startups',
    description: 'The Lean Startup provides a scientific approach to creating and managing startups and get a desired product to customer hands faster (Source: The Lean Startup <http://theleanstartup.com/principles>)',
    img_url: [],
    img_title: '',
    order: 2,
    tags: ['startups'],
    related: [],
    keywords: [],
    safe: true,
    moderation_required: false,
    template: 'category',
    added_by: 'colearnr',
    added_date: new Date(),
    last_updated: new Date(),
    path: ',entrepreneurship,',
    overrides: {template: 'topic'},
    collaborators: ['b62bc9cbe87452839d6d79a844590956'],
    discuss_id: 5,
    privacy_mode: 'public'
  })

  db.topics.insert({
    name: 'Introduction',
    short_name: 'lean-intro',
    id: 'lean-introduction',
    description: 'Introduction to the lean startup approach through a short presentation and a talk by the creator Eric Ries',
    img_url: [],
    img_title: '',
    order: 1,
    tags: ['startups'],
    related: [],
    keywords: [],
    safe: true,
    moderation_required: false,
    template: 'category',
    added_by: 'colearnr',
    added_date: new Date(),
    last_updated: new Date(),
    path: ',entrepreneurship,lean-startups,',
    discuss_id: 5,
    collaborators: ['b62bc9cbe87452839d6d79a844590956'],
    privacy_mode: 'public'
  })

  db.topics.insert({id: 's1', name: 's1', path: null, collaborators: ['63621cbc4fd4b89ac7717467e819daf7']})
  db.topics.insert({id: 's2', name: 's2', path: ',s1,', collaborators: ['63621cbc4fd4b89ac7717467e819daf7']})
  db.topics.insert({id: 's3', name: 's3', path: ',s1,', collaborators: ['63621cbc4fd4b89ac7717467e819daf7']})

  db.topics.insert({id: 't1', name: 't1', path: null})
  db.topics.insert({id: 't2', name: 't2', path: ',t1,', collaborators: ['63621cbc4fd4b89ac7717467e819daf8']})
  db.topics.insert({id: 't3', name: 't3', path: ',t1,', collaborators: ['63621cbc4fd4b89ac7717467e819daf8']})

  db.learnbits.insert({
    title: 'Talk by Eric Ries at Google',
    description: '',
    type: 'youtube',
    url: 'http://www.youtube.com/watch?v=fEvKo90qBns',
    img_url: [],
    img_title: '',
    body: '{"embed": "fEvKo90qBns", "start" : "161"}',
    source: '',
    license: '',
    topics: ['lean-introduction'],
    order: 2,
    tags: ['startups'],
    added_by: 'colearnr',
    added_date: new Date(),
    last_updated: new Date(),
    related: [],
    entities: [],
    keywords: [],
    safe: true,
    moderation_required: false,
    privacy_mode: 'public'
  })

  db.topics.insert({id: 'l1', name: 'l1', path: null})
  db.topics.insert({id: 'l2', name: 'l2', path: ',l1,', collaborators: ['63621cbc4fd4b89ac7717467e819daf9']})
  db.topics.insert({id: 'l3', name: 'l3', path: ',l1,', collaborators: ['63621cbc4fd4b89ac7717467e819daf9']})
  db.topics.insert({id: 'l4', name: 'l4', path: ',l1,l3,', collaborators: ['63621cbc4fd4b89ac7717467e819daf9']})
  db.topics.insert({id: 'l5', name: 'l5', path: ',l1,l3,', collaborators: ['63621cbc4fd4b89ac7717467e819daf9']})
  db.topics.insert({id: 'l6', name: 'l6', path: ',l1,l3,l4,', collaborators: ['63621cbc4fd4b89ac7717467e819daf9']})
  db.topics.insert({id: 'l7', name: 'l7', path: ',l1,l3,l4,', collaborators: ['63621cbc4fd4b89ac7717467e819daf9']})
  db.topics.insert({id: 'l8', name: 'l8', path: ',l1,l3,l4,', collaborators: ['63621cbc4fd4b89ac7717467e819daf9']})
  db.topics.insert({id: 'l9', name: 'l9', path: ',l1,l3,l4,', collaborators: ['63621cbc4fd4b89ac7717467e819daf9']})

  db.topics.insert({id: 'l10', name: 'l10', path: ',l1,l3,', collaborators: ['63621cbc4fd4b89ac7717467e819daf9']})
  db.topics.insert({id: 'l11', name: 'l11', path: ',l1,l3,l5,', collaborators: ['63621cbc4fd4b89ac7717467e819daf9']})
  db.topics.insert({id: 'l12', name: 'l12', path: ',l1,l3,l5,', collaborators: ['63621cbc4fd4b89ac7717467e819daf9']})

  db.topics.insert({id: 'w1', name: 'w1', path: null, collaborators: ['63621cbc4fd4b89ac7717467e819daf9']})
  db.topics.insert({id: 'w2', name: 'w2', path: null, collaborators: ['63621cbc4fd4b89ac7717467e819daf9']})
  db.topics.insert({id: 'w3', name: 'w3', path: ',w2,', collaborators: ['63621cbc4fd4b89ac7717467e819daf9']})
  db.topics.insert({id: 'w4', name: 'w4', path: ',w2,', collaborators: ['63621cbc4fd4b89ac7717467e819daf9']})
}

setupTestDb()

vows.describe('db').addBatch({
  'When using the db module': {
    'to find lean startups topic': {
      topic: function () {
        db.topics.findOne({id: 'lean-startups'}, this.callback)
      },
      'should have the name Lean Startups': function (err, topicObj) {
        should.not.exist(err)
        topicObj.should.have.property('name').and.equal('Lean Startups')
      },
      'should have the path ,entrepreneurship,': function (err, topicObj) {
        should.not.exist(err)
        topicObj.should.have.property('path').equal(',entrepreneurship,')
      }
    },
    'to query the learnbits': {
      topic: function () {
        db.learnbits.findOne({title: 'Talk by Eric Ries at Google'}, this.callback)
      },
      'should have the type youtube': function (err, lbit) {
        should.not.exist(err)
        lbit.should.have.property('type').equal('youtube')
      },
      'should have the topics with length 1': function (err, lbit) {
        should.not.exist(err)
        lbit.should.have.property('topics').with.length(1)
      }
    }
  }
})
  .addBatch({
    'When using the query lib': {
      'to find collab topic at level 1': {
        topic: function () {
          query.get_user_collab_topics({_id: 'b62bc9cbe87452839d6d79a844590956'}, this.callback)
        },
        'should have entrepreneurship': function (err, topics) {
          should.not.exist(err)
          topics.length.should.equal(1)
          topics[0].should.have.property('name').equal('Lean Startups')
          topics[0].should.have.property('level').equal(2)
          topics[0].should.have.property('topics')
          let stopics = topics[0].topics
          stopics.length.should.equal(1)
          stopics[0].should.have.property('name').equal('Introduction')
          stopics[0].should.have.property('level').equal(3)
        }
      },
      'to find collab topic at level 1.1': {
        topic: function () {
          query.get_user_collab_topics({_id: '63621cbc4fd4b89ac7717467e819daf7'}, this.callback)
        },
        'should have s1 tree': function (err, topics) {
          should.not.exist(err)
          topics.length.should.equal(1)
          topics[0].should.have.property('name').equal('s1')
          topics[0].should.have.property('level').equal(1)
        }
      },

      'to find collab topic at level 2': {
        topic: function () {
          query.get_user_collab_topics({_id: '63621cbc4fd4b89ac7717467e819daf8'}, this.callback)
        },
        'should have t2 and t3': function (err, topics) {
          should.not.exist(err)
          topics.length.should.equal(2)
          topics[0].should.have.property('name').equal('t2')
          topics[0].should.have.property('level').equal(2)
          topics[1].should.have.property('name').equal('t3')
          topics[1].should.have.property('level').equal(2)
        }
      },

      'to find collab topic complex scenairo': {
        topic: function () {
          query.get_user_collab_topics({_id: '63621cbc4fd4b89ac7717467e819daf9'}, this.callback)
        },
        'should have l2 and l3 tree': function (err, topics) {
          should.not.exist(err)
          topics.length.should.equal(4)
          topics[0].should.have.property('name').equal('w1')
          topics[0].should.have.property('level').equal(1)

          topics[1].should.have.property('name').equal('w2')
          topics[1].should.have.property('level').equal(1)
          topics[1].should.have.property('topics')
          topics[1].topics.length.should.equal(2)
          let w2topics = topics[1].topics
          w2topics[0].should.have.property('name').equal('w3')
          w2topics[1].should.have.property('name').equal('w4')

          topics[2].should.have.property('name').equal('l2')
          topics[2].should.have.property('level').equal(2)

          topics[3].should.have.property('name').equal('l3')
          topics[3].should.have.property('level').equal(2)
          topics[3].should.have.property('topics')
          topics[3].topics.length.should.equal(3)

          let l3topics = topics[3].topics
          l3topics.length.should.equal(3)
          l3topics[0].should.have.property('name').equal('l4')
          l3topics[1].should.have.property('name').equal('l5')
          l3topics[2].should.have.property('name').equal('l10')

          let l4topics = l3topics[0].topics
          l4topics.length.should.equal(4)
          l4topics[0].should.have.property('name').equal('l6')
          l4topics[1].should.have.property('name').equal('l7')
          l4topics[2].should.have.property('name').equal('l8')
          l4topics[3].should.have.property('name').equal('l9')

          let l5topics = l3topics[1].topics
          l5topics.length.should.equal(2)
          l5topics[0].should.have.property('name').equal('l11')
          l5topics[1].should.have.property('name').equal('l12')
        }
      }
    }
  }).export(module)
