'use strict'

const GridFS = require('../gridfs')
const vows = require('vows')
const path = require('path')
const should = require('should')

const TEST_DOC = path.resolve(__dirname, 'sample.docx')
// const TEST_PPT = path.resolve(__dirname, 'sample.pptx')
// const TEST_XLS = path.resolve(__dirname, 'sample.xlsx')

const suite = vows.describe('GridFS test suite')
suite.addBatch({
  'Check if we can store to gridfs': {
    topic: function () { GridFS.storeFile(TEST_DOC, null, this.callback) },
    'no error': function (err, res) {
      should.not.exist(err)
      should.exist(res)
    }
  },
  'Check if the file exists gridfs': {
    topic: function () { GridFS.exists(null, 'sample.docx', this.callback) },
    'no error': function (err, res) {
      should.not.exist(err)
      should.ok(res)
    }
  },
  'Check if the file can be read gridfs': {
    topic: function () { GridFS.readFile(null, 'sample.docx', null, this.callback) },
    'no error': function (err, res) {
      should.not.exist(err)
      should.ok(res)
      res.on('data', function (chunk) {
        console.log('got %d bytes of data', chunk.length)
      })
      res.on('end', function () {
        console.log('there will be no more data.')
      })
    }
  },
  'Check if we can remove the file from gridfs': {
    topic: function () { GridFS.remove(null, 'sample.docx', this.callback) },
    'no error': function (err, res) {
      should.not.exist(err)
      should.ok(res)
    }
  }
}).export(module)
