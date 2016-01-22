var AccessTokens = require('../access-tokens'),
    vows = require('vows'),
    should = require('should');

var suite = vows.describe('access tokens test suite');
suite.addBatch({
    "Check if we can create access token": {
        topic: function () { AccessTokens.create('12345', {ttl: 30}, this.callback); },
        'error': function(err, res) {
            should.not.exist(err);
            should.exist(res);
        }
    },
    "Check if we can create/validate domain specific access token": {
        topic: function () {
            var self = this; 
            AccessTokens.create('123456', { ttl: 30, domain: 'colearnr.com' }, function (err, domainToken) {
                AccessTokens.validate({ _id: '124' }, '123456', domainToken, {domain: 'colearnr.com'}, self.callback);
            });            
        },
        'error': function(err, res) {
            should.not.exist(err);
            res.should.be.true;
        }
    },
    "Check if we can create/validate domain specific access token - fail case": {
        topic: function () {
            var self = this; 
            AccessTokens.create('123457', { ttl: 30, domain: 'colearnr.com' }, function (err, domainToken) {
                AccessTokens.validate({ _id: '124' }, '123457', domainToken, {domain: 'google.com'}, self.callback);
            });            
        },
        'error': function(err, res) {
            should.not.exist(err);
            res.should.be.false;
        }
    },
    "Check if we can create/validate user specific access token": {
        topic: function () {
            var self = this; 
            AccessTokens.create('123458', { ttl: 30, valid_for_users: ['123'] }, function (err, domainToken) {
                AccessTokens.validate({ _id: '123' }, '123458', domainToken, {}, self.callback);
            });            
        },
        'error': function(err, res) {
            should.not.exist(err);
            res.should.be.true;
        }
    },
    "Check if we can create/validate user specific access token - fail case": {
        topic: function () {
            var self = this; 
            AccessTokens.create('123459', { ttl: 30, valid_for_users: ['123'] }, function (err, domainToken) {
                AccessTokens.validate({ _id: '124' }, '123459', domainToken, {}, self.callback);
            });            
        },
        'error': function(err, res) {
            should.not.exist(err);
            res.should.be.false;
        }
    }    
})
.export(module);