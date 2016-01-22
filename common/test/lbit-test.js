process.env.MONGO_DB_NAME = 'int-test';

var vows = require('vows'),
    db = require('../db'),
    should = require('should'),
    create_lbit = require('../create_learn_bit');

var elem = {
    'sub-topic' : 'test-topic',
    'url': 'http://www.youtube.com/watch?feature=player_embedded&v=YZ-xwPegXeA',
    'author': 'qa-test'
};

function setupTestDb() {
    db.topics.remove();
    db.topics.dropIndexes();
    db.learnbits.remove();
    db.learnbits.dropIndexes();
}

setupTestDb();

vows.describe('create learn bit').addBatch({
    "When using the create learn bit library": {
        "to parse youtube url": {
            topic: function() {
                create_lbit(null, elem, this.callback)
            },
            "checks": function (err, lbit, isUpdate) {
                should.not.exist(err);
                lbit.should.not.be.null;
                lbit.should.have.property('type');
                lbit.type.should.equal('youtube');
                lbit.url.should.equal('http://www.youtube.com/watch?v=YZ-xwPegXeA');
                lbit.body.should.equal('{"embed":"YZ-xwPegXeA"}');
                lbit.topics.should.have.length(1);
                lbit['added_by'].should.equal(elem.author);
                lbit['privacy_mode'].should.equal('private');
            },
        },
    }
}).export(module);
