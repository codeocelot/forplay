var secrets = require('../config/secrets');
var request = require('request');
var CronJob = require('cron').CronJob;
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var _ = require('underscore')
var Forecast = require('forecast.io-bluebird');
var forecast = new Forecast({key:secrets.forecastApiKey,timeout:2500});
var forecastOptions = {
  units : 'ca'
}

var textBeltUrl = secrets.textBeltUrl;
var forecastApiKey = secrets.forecastApiKey;

function formatMessage(hours,point){
  var condition = point.condition;
  var numHours = hits.length;
  var msg = "Alert " + condition.type + " " + condition.operator + " than " + condition.value + " for " + numHours + " of nxt 49hrs "+ " " + point.message;
}

// cronjob to text people
// new CronJob('* * */6 * * *',doCron(),null, true, 'America/Los_Angeles')

function doCron(){
  console.log('new cron job begun')
  getAllPoints(function(err,points){
    if(err){
      return console.error('could not get points from mongo.');
    }
    else{
      points.forEach(function(point){
        // first gotta get the user's phone number.
        MongoClient.connect(secrets.db,function(err,db){
          var objID = new ObjectID(el.userID);
          db.collection('users').findOne({_id:objID},function(err,user){
            if(err){
              console.error('could not find user to send message')
            }
            else {
              if(!user.profile || !user.profile.phoneNumber){
                return // can't contact them I guess...
              }
              checkWeatherCondition(point.condition,point.lat,point.lng,function(err,hits){
                if( !hits || !hits.length || err) {
                  console.log('error occured', err);
                  return;
                }
                var msg = formatMessage(hits,el)
                sendSms({
                  number:user.profile.phoneNumber,
                  message:msg
                })
              })
            }
          })
        })
      })
    }
  })
}

function checkWeatherCondition(condition,lat,lng,callback){
  fetchTheWeather(lat,lng)
    .then(function(weather){
      var ops = {
        "greater" : function(a,b){return a > b},
        "lesser" : function(a,b){return a < b},
        "equal" : function(a,b){return a === b}
      }
      var hourlyObs = weather.hourly.data;
      var hits = _.filter(hourlyObs,function(obs){
        var observedValue = obs[condition.type];
        var operator = ops[condition.operator];
        var storedValue = +condition.value;
        return operator(observedValue,storedValue);
      });
      if(hits.length){
        return callback(null,hits);
      }
      else{
        return callback({error:'no hits found'},null);
      }
    })
    .catch(function(err){
      console.error("couldn't get the weather, ", err)
      callback(err,null);
    })
}

// okay so here we get to use promises.
// forgive me my father, for I have mixed async techniques.
function fetchTheWeather(lat,lng,options){
  var opts = options || forecastOptions;
  return forecast.fetch(lat,lng,opts);
}

function sendSms(options,cb){
  if(!options || !options.number || !options.message) return "I need more information";
  request.post(
    {
      url:textBeltUrl,
      form:{number:options.number,message:options.message}
    },function(error,response,body){
      if(error)
        console.log('got error from textbelt: ', {error:error, response:response,body:body});
    }
  )
};

function insertWatchPoint(userID,placename,lat,lng,condition,message,callback){
  MongoClient.connect(secrets.db,function(err,db){
    var col = db.collection('watchPoints');
    col.insert({userID:userID,placename:placename,lat:lat,lng:lng,condition:condition,message:message},function(err,result){
      if(err) return callback(err,null);
      return callback(null,callback);
    });
  })
}

function getAllPoints(callback){
  MongoClient.connect(secrets.db,function(err,db){
    var col = db.collection('watchPoints');
    col.find().toArray(function(err,docs){
      if(err) callback(err,null);
      else callback(null,docs);
    })
  })
}



exports.getPoints = getPoints = function(userID,callback){
  MongoClient.connect(secrets.db,function(err,db){
    var col = db.collection('watchPoints');
    var objId = new ObjectID(userID.toString());
    col.find({userID: objId}).toArray(function(err,docs){
      if(err) callback(err,null);
      else callback(null,docs);
    })
  })
}

exports.getPointsRequest = function(req,res){
  getPoints(req.user._id,function(err,points){
    if(err) return res.status(500);
    res.status(200).send(points);
  })
}

exports.deletePoint = function(req,res){
  console.log("point to delete: ", req.params.id);
  var id = new ObjectID(req.params.id.toString());
  MongoClient.connect(secrets.db,function(err,db){
    // do some error checking
    var col = db.collection('watchPoints');
    col.deleteOne({_id:id},function(err,result){
      // if(err)
      //   req.flash('error',{msg:'could not delete point'});
      // else req.flash('success',{msg:'successfully deleted point'})
      // res.redirect('/')
      res.status(200).send('hi world')
      console.log('successfully deleted')
      return;
    })
  })
}

exports.postNewWatch = function(req,res){

  // pre-defined location
  console.log('received predifined valued ', req.body.preset)
  if(req.body.preset){
    console.log(req.body.preset)
    req.body = JSON.parse(req.body.preset);
    console.log(req.body);
    console.log(req.body.lat,req.body.lng)
  }

  var id = req.user._id,
  lat = +req.body.lat,
  lng = +req.body.lng,
  placename = req.body.placename;
  condition = {
    type:req.body.conditionType,
    operator:req.body.conditionOperator,
    value:req.body.conditionValue
  }
  if(!lat || !lng || !placename || !condition.type || !condition.operator || !condition.value){
    console.log('received ', lat,lng,placename,condition.type,condition.operator,condition.value)
    return res.send('invalid input').status(400);
  }
  message = req.body.message || '';
  insertWatchPoint(req.user._id,placename,lat,lng,condition,message,function(err,result){
    if(err){
      req.flash('error', { msg: 'Could not save point.' });
      res.redirect('/');
      return;
    }
    //req.flash('success', { msg: 'Success! You just saved a point' });
    res.redirect('/');
    return;
  })


}
