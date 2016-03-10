'use strict'

let Entitlement = require('../entitlement')
let vows = require('vows')
let constants = require('../../common/constants')
let should = require('should')

Entitlement.setPlan('unlimited')
Entitlement.setAccessCode(['testcode'])

let suite = vows.describe('entitlements test suite')
suite.addBatch({
  'Check if mock user can signup with no access code': {
    topic: function () { Entitlement.isSignupAllowed('prabhu@colearnr.com', null, this.callback) },
    'error': function (err, res) {
      should.exist(err)
      err.should.equal(constants.INVALID_ACCESS_CODE)
      res.should.be.false
    }
  },
  'Check if mock user can signup with invalid access code': {
    topic: function () { Entitlement.isSignupAllowed('prabhu@colearnr.com', {access_code: 'blahblah'}, this.callback) },
    'error': function (err, res) {
      should.exist(err)
      err.should.equal(constants.INVALID_ACCESS_CODE)
      res.should.be.false
    }
  },
  'Check if mock user can signup with valid access code': {
    topic: function () { Entitlement.isSignupAllowed('prabhu@colearnr.com', {access_code: 'testcode'}, this.callback) },
    'error': function (err, res) {
      should.not.exist(err)
      res.should.be.true
    }
  }
})
suite.addBatch({
  'Check if mock user can signup with valid access code on a lite plan': {
    topic: function () {
      Entitlement.setPlan('lite')
      Entitlement.isSignupAllowed('prabhu@colearnr.com', {access_code: 'testcode'}, this.callback)
    },
    'error': function (err, res) {
      should.exist(err)
      err.should.equal(constants.MAX_USERS_REACHED)
      res.should.be.false
    }
  },
  'Check if mock user can signup with valid access code on an unlimited plan': {
    topic: function () {
      Entitlement.setPlan('unlimited')
      Entitlement.isSignupAllowed('prabhu@colearnr.com', {access_code: 'testcode'}, this.callback)
    },
    'error': function (err, res) {
      should.not.exist(err)
      res.should.be.true
    }
  },
  'Check if mock user can signup with valid access code on an invalid plan': {
    topic: function () {
      Entitlement.setPlan('unlimited123')
      Entitlement.isSignupAllowed('prabhu@colearnr.com', {access_code: 'testcode'}, this.callback)
    },
    'error': function (err, res) {
      should.exist(err)
      err.should.equal(constants.MAX_USERS_REACHED)
      res.should.be.false
    }
  }
}).export(module)
