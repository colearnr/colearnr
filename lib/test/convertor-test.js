'use strict'

const OfficeConvertor = require('../office-convertor')
const vows = require('vows')
const path = require('path')
const should = require('should')
const fs = require('fs-extra')

const TEST_DOC = '/tmp/sample.docx'
const TEST_PPT = '/tmp/sample.pptx'
const TEST_XLS = '/tmp/sample.xlsx'

fs.copySync(path.resolve(__dirname, 'sample.docx'), TEST_DOC)
fs.copySync(path.resolve(__dirname, 'sample.pptx'), TEST_PPT)
fs.copySync(path.resolve(__dirname, 'sample.xlsx'), TEST_XLS)

const suite = vows.describe('convertor test suite')
suite.addBatch({
  'Check if we can convert docx': {
    topic: function () { OfficeConvertor.convert(TEST_DOC, 'pdf', this.callback) },
    'no error': function (err, res) {
      should.not.exist(err)
    }
  }
}).export(module)
