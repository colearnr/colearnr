var winston = require('winston')

var log = new (winston.Logger)({
  exitOnError: false,
  transports: [
    new (winston.transports.Console)({
      handleExceptions: true,
      json: false,
      timestamp: true,
      level: (process.env.NODE_ENV === 'development') ? 'debug' : 'info'
    })
  ]
})

module.exports = log
