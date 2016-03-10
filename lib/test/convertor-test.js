'use strict'

let OfficeConvertor = require('../office-convertor')
let vows = require('vows')
let path = require('path')
let should = require('should')
let fs = require('fs-extra')

let TEST_DOC = '/tmp/sample.docx'
let TEST_PPT = '/tmp/sample.pptx'
let TEST_XLS = '/tmp/sample.xlsx'

fs.copySync(path.resolve(__dirname, 'sample.docx'), TEST_DOC)
fs.copySync(path.resolve(__dirname, 'sample.pptx'), TEST_PPT)
fs.copySync(path.resolve(__dirname, 'sample.xlsx'), TEST_XLS)

let suite = vows.describe('convertor test suite')
suite.addBatch({
  'Check if we can convert docx': {
    topic: function () { OfficeConvertor.convert(TEST_DOC, 'pdf', this.callback) },
    'no error': function (err, res) {
      should.not.exist(err)
    }
  }
}).export(module)
