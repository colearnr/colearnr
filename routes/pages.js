var util = require ("../common/util")
    , query = require("../common/query")
    , config = require("../lib/config").config
    , db = require("../common/db")
    , _ = require('lodash');

exports.load = function(req, res) {
	var brand_page = req.params['page'];
	res.render('includes/branding/' + brand_page);
}
