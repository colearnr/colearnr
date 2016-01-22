var winston = require('winston');

var log = new (winston.Logger)({
    exitOnError: false,
    transports: [
        new (winston.transports.Console)({
            handleExceptions: true,
            json: false,
            timestamp: true,
            level: (!process.env.ENV_CONFIG || process.env.ENV_CONFIG.indexOf('dev') != -1) ? 'debug' : 'info'
        })
    ]
});

module.exports = log;
