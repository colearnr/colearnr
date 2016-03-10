'use strict'

exports.load = function (req, res) {
  let brand_page = req.params['page']
  res.render('includes/branding/' + brand_page)
}
