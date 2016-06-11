const pjson = require('./package.json')
module.exports = pjson.version + ((process.env.NODE_ENV === 'development') ? '-' + Math.random() : '')
