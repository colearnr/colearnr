var config_lib = require('./config-default'),
    config = config_lib.config,
    _ = require('lodash');

try {
    var override_config = require('/cl/conf/config.js').config;
    _.merge(config, override_config);
} catch (e) {

}

exports.configure = config_lib.configure;
exports.config = config;
