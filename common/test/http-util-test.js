'use strict'

const vows = require('vows')
const http_utils = require('../http_utils')
const assert = require('assert')
vows.describe('http_util').addBatch({
  'When using the http util module': {
    "to get google's header": {
      topic: function () {
        http_utils.getHeaders('http://www.gmail.com', this.callback)
      },
      'should return value': function (topic, err, data, index) {
        assert.isNotNull(topic)
        assert.isNotNull(topic.headers)
        assert.include(topic.headers, 'x-content-type-options')
        assert.equal(topic.headers['x-content-type-options'], 'nosniff')
      }
    },

    "to check google's header": {
      topic: function () {
        http_utils.isFrameRestricted('http://www.colearnr.com', this.callback)
      },
      'should return value': function (err, res) {
        assert.isNull(err)
        assert.isFalse(res)
      }
    },

    'to get colearnr header': {
      topic: function () {
        http_utils.getHeaders('http://www.colearnr.com', this.callback)
      },
      'should return value': function (topic, err, data, index) {
        assert.isNotNull(topic)
        assert.isNotNull(topic.headers)
      }
    }
  }
}).export(module)
