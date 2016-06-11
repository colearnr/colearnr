const util = require('../common/util')
const _ = require('lodash')
const constants = require('../common/constants')
const logger = require('../common/log')
const db = require('../common/db')
const bcrypt = require('bcrypt')
const config = require('./config').config
const XLSImport = require('./xlsImport')

let UserImport = {}

UserImport.substitutor = function (row) {
  if (!row) {
    return null
  }
  let subsRow = {}
  let salt = bcrypt.genSaltSync(constants.SALT_WORK_FACTOR)
  // hash the password along with our new salt
  let hash = bcrypt.hashSync(config.default_password, salt)
  subsRow['salt'] = salt
  subsRow['password'] = hash
  for (let key in row) {
    let name = {first: '', last: ''}
    let val = util.trim(row[key]) || ''
    switch (key.toLowerCase().replace(/ /g, '')) {
      case 'firstname':
        if (subsRow['name']) {
          name = subsRow['name']
        }
        name['first'] = val
        subsRow['name'] = name
        break
      case 'lastname':
        if (subsRow['name']) {
          name = subsRow['name']
        }
        name['last'] = val
        subsRow['name'] = name
        break
      case 'e-mail':
      case 'email':
        val = val.toLowerCase()
        subsRow['emails'] = val.split(',')
        let id = util.create_hash(subsRow['emails'][0])
        subsRow['email_verified'] = true
        subsRow['_id'] = id
        break
      case 'institution':
      case 'currentinstitution':
        subsRow['organisation'] = val
        break
      case 'position':
      case 'currentposition':
        subsRow['description'] = val
        break
      case 'countryduringprogram':
        subsRow['location'] = val
        break
      default:
        subsRow[key] = val
    }
  }
  if (subsRow.name && subsRow.name.first && subsRow.name.last) {
    subsRow['displayName'] = util.capitalise(subsRow.name.first) + ' ' + util.capitalise(subsRow.name.last)
  }
  subsRow['join_date'] = new Date()
  subsRow['acct_imported'] = true
  subsRow['temporary_password'] = true
  subsRow['agree_terms'] = 'agreed'
  subsRow['profileImage'] = config.cdn_prefix + '/images/profile/profile_' + util.random(1, 10) + '.jpg'
  return subsRow
}

UserImport.fromXLS = function (xlsFile, substitutorFn, callback) {
  XLSImport.getAsJson(xlsFile, (substitutorFn || UserImport.substitutor), function (err, dataMap) {
    if (!err) {
      let keys = _.keys(dataMap)
      let newUsers = dataMap[keys[0]]
      logger.log('info', 'About to import', newUsers.length, 'users')
      let done = 0
      newUsers.forEach(function (auser) {
        db.users.save(auser)
        done++
        if (done === newUsers.length) {
          callback(err, newUsers)
        }
      })
    } else {
      callback(err, null)
    }
  })
}

exports.UserImport = UserImport

let main = function () {
  let argv = require('optimist')
    .usage('Usage: $0 --xlsFile [xlsFile]')
    .demand(['xlsFile'])
    .argv
  UserImport.fromXLS(argv.xlsFile, null, function (err, data) {
    console.log(err, data)
  })
}

if (require.main === module) {
  main()
}
