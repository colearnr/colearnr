var OfficeConvertor = require('../office-convertor'),
    vows = require('vows'),
    path = require('path'),
    should = require('should'),
    fs = require('fs-extra');

var TEST_DOC = '/tmp/sample.docx',
    TEST_PPT = '/tmp/sample.pptx',
    TEST_XLS = '/tmp/sample.xlsx';

fs.copySync(path.resolve(__dirname, 'sample.docx'), TEST_DOC);
fs.copySync(path.resolve(__dirname, 'sample.pptx'), TEST_PPT);
fs.copySync(path.resolve(__dirname, 'sample.xlsx'), TEST_XLS);

var suite = vows.describe('convertor test suite');
suite.addBatch({
    "Check if we can convert docx": {
        topic: function() { OfficeConvertor.convert(TEST_DOC, 'pdf', this.callback); },
        'no error': function(err, res) {
            should.not.exist(err);
        }
    }
})
.export(module);
