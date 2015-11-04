//var points = require('./watchPoints.js');
/**
* GET /
* Home page.
*/
exports.home = function(req, res) {
  // console.log('home requested by', req.user)
  if(req.user.profile.phoneNumber === '')
  req.flash('error',{msg:'You need to provide a phone number under the settings page.'})
  res.render('home',{title:'Home'})
};

exports.index = function(req, res) {
  res.render('index',{title:'Welcome'})
};
