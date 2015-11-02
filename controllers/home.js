//var points = require('./watchPoints.js');
/**
* GET /
* Home page.
*/
exports.index = function(req, res) {
  // console.log('home requested by', req.user)
  if(req.user.profile.phoneNumber === '')
  req.flash('error',{msg:'You need to provide a phone number under the settings page.'})
  res.render('home',{title:'Home'})
  // points.getPoints(req.user._id,function(err,pts){
  //   if(err){
  //     req.flash('error',{msg:'Could not retrieve points'});
  //   }
  //   console.log('points are: ', pts);
  //   res.render('home',{
  //     title:'Home',
  //     points:pts
  //   })
  // })
  // res.render('home', {
  //   title: 'Home'
  // });
};
