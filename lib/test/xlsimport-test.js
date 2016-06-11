'use strict'

const XLSImport = require('../xlsImport')

XLSImport.getAsJson('test.xlsx', null, function (err, data) {
  console.log(err, data)
})
