var Apps = require('../apps'),
  vows = require('vows'),
  constants = require("../../common/constants"),
  should = require('should');

var suite = vows.describe('apps test suite');
suite.addBatch({
  "Check if we can list all apps": {
    topic: Apps.list(),
    'error': function(err, res) {
      should.not.exist(err);
      res.should.not.be.null;
    }
  },
  "Check if we can clear apps": {
    topic: Apps.clear(),
    'error': function(err, res) {
      should.not.exist(err);
      res.should.be.blank;
    }
  },
  "Check if we can reload apps": {
    topic: Apps.reload(),
    'error': function(err, res) {
      should.not.exist(err);
      res.should.not.be.null;
    }
  },
  "Check if we can retrieve information about apps": {
    topic: Apps.getInfo('codraw'),
    'error': function(err, res) {
      should.not.exist(err);
      res.should.not.be.null;
    }
  },
  "Check if we can retrieve app module": {
    topic: Apps.get('codraw'),
    'error': function(err, res) {
      should.not.exist(err);
      res.should.not.be.null;
    }
  },
  "Check if we can retrieve all app module": {
    topic: Apps.getAll(),
    'error': function(err, res) {
      should.not.exist(err);
      res.should.not.be.null;
    }
  },
  "Check if we can retrieve the app for a learnbit type": {
    topic: Apps.getForType('draw'),
    'error': function(err, res) {
      should.not.exist(err);
      res.should.not.be.null;
    }
  },
  "Check if we can retrieve the app for an invalid learnbit type": {
    topic: Apps.getForType('drawing1'),
    'error': function(err, res) {
      should.not.exist(err);
      should.not.exist(res);
    }
  }
}).export(module);
