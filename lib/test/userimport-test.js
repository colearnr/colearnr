'use strict'

let UserImport = require('../userImport').UserImport

UserImport.fromXLS('test.xlsx', null, function (err, data) {
  console.log(err, data)
})
