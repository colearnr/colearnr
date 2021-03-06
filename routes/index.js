'use strict'

const config = require('../lib/config').config
const constants = require('../common/constants')

exports.index = function (req, res) {
  let user = req.user
  if (req.session && user && !user.guestMode) {
    res.redirect(constants.DEFAULT_HOME_PAGE)
  } else {
    res.render(config.index_page || constants.INDEX_PAGE, {constants: constants, config: config})
  }
}
