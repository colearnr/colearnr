var vows = require('vows'),
    should = require('should'),
    http_utils = require('../http_utils');

vows.describe('http_util').addBatch({
    "When using the http util module": {
        "to get google's header": {
            topic: function() {
                http_utils.getHeaders('http://www.google.com', this.callback);
            },
            "should become Hello": function (topic, err, data, index) {
                topic.should.not.be.null;
                topic.headers.should.not.be.null;
                topic.headers.should.have.property('x-frame-options');
                topic.headers['x-frame-options'].should.equal('SAMEORIGIN');
            },
        },

        "to check google's header": {
            topic: function() {
                http_utils.isFrameRestricted('http://www.google.com', this.callback);
            },
            "should become Hello": function (err, res) {
                should.not.exist(err);
                res.should.be.true;
            },
        },

        "to get colearnr header": {
            topic: function() {
                http_utils.getHeaders('http://www.colearnr.com', this.callback);
            },
            "should become Hello": function (topic, err, data, index) {
                topic.should.not.be.null;
                topic.headers.should.not.be.null;
                topic.headers.should.not.have.property('x-frame-options');
            },
        },

    }
}).export(module);
