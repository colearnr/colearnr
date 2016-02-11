var config_lib = require('./config-default')
var config = config_lib.config
var _ = require('lodash')

try {
  var confDir = config_lib.config.cl_conf_dir
  var override_config = require(confDir + '/config.js').config
  _.merge(config, override_config)
} catch (e) {}

exports.configure = config_lib.configure
exports.config = config
