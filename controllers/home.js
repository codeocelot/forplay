var points = require('./watchPoints.js');
/**
 * GET /
 * Home page.
 */
exports.index = function(req, res) {
  console.log('home requested by', req.user)
  points.getPoints(req.user._id,function(err,pts){
    if(err){
      req.flash('error',{msg:'Could not retrieve points'});
    }
    console.log('points are: ', pts);
    res.render('home',{
      title:'Home',
      points:pts
    })
  })
  // res.render('home', {
  //   title: 'Home'
  // });
};
