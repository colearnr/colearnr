const ejs = require('ejs')
const parse = ejs.parse
ejs.parse = function (str, options) {
  str = str.replace(/^\s+|\s+$|[\r\n]+/gm, '')
  return parse.apply(this, [str, options])
}
