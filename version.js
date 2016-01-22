var pjson = require('./package.json');
module.exports = pjson.version + ((!process.env.ENV_CONFIG || 'dev' == process.env.ENV_CONFIG || 'dev-test' == process.env.ENV_CONFIG) ? '-' + Math.random() : '');
