var config_lib = require('./config-default'),
  config = config_lib.config,
  process = require('process'),
  _ = require('lodash');

try {
  var confDir = config_lib.config.cl_conf_dir;
  var override_config = require(confDir + '/config.js').config;
  _.merge(config, override_config);
} catch (e) {

}

exports.configure = config_lib.configure;
exports.config = config;
