exports.load = function (req, res) {
  var brand_page = req.params['page']
  res.render('includes/branding/' + brand_page)
}
