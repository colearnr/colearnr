const config_lib = require('./config-default')
const config = config_lib.config
const _ = require('lodash')

try {
  const confDir = config_lib.config.cl_conf_dir
  const override_config = require(confDir + '/config.js').config
  _.merge(config, override_config)
} catch (e) {}

exports.configure = config_lib.configure
exports.config = config
