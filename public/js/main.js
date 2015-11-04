$(document).ready(function() {

  // Place JavaScript code here...
  if(document.getElementById('map'))
    initMap();

});


var map;
var newPoint;
var newLat,newLng;
var setPoints = [];

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 49.124092, lng:-125.902793},
    zoom: 8
  });
  setPoints.forEach(function(point,i){
    setPoints[i].marker = new google.maps.Marker({
      icon:'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      position:{lat:+point.lat,lng:+point.lng},
    })
  })

  getPoints();
  setListeners();
}

function resizeMap(){
  google.maps.event.trigger(map, "resize");
}

function setListeners(){
  map.addListener('click',function(e){
    if(newPoint){
      newPoint.setMap(null)
    }
    newPoint = new google.maps.Marker({
      icon:'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
      position:e.latLng,
      map:map
    })

    newLat = e.latLng.lat();
    newLng = e.latLng.lng();
    document.getElementById('newLat').value = newLat;
    document.getElementById('newLng').value = newLng;

    $("#map").collapse('toggle');
    $("#showMap").collapse('toggle')
    console.log('map click occured')
  })
  // $("button#createBtn").on('click',function(){
  //   resizeMap();
  // })
  $("#showMap").on('click',function(){
    $("#map").collapse('toggle');
    console.log('collapse occured')
  })

  $("form.newPoint.collapse").on('shown.bs.collapse',function(){
    resizeMap();
  })

}

function getPoints(){
  $.get("points",function(points){
    setPoints = points;
    setPoints.map(function(point){
      renderListElement(point);
      point.marker=addMarker(point);
    });
    $(".watchPoint").click(function(e){
      centerPoint(e.currentTarget.id);

    })
    $("button.btn-remove-point").click(function(event){
      var id = event.target.id;
      $.ajax(
        {
          method:"DELETE",
          url:'/point/'+id,
          data:{_csrf:_csrf},
          success:function(){
            $('#'+id).remove();
            removeMarker(id);
          }
        }
      )
    })
  })
}

function centerPoint(id){
  var point = setPoints.find(function(point){return point._id === id})
  map.setCenter(new google.maps.LatLng(+point.lat,+point.lng))
}
function renderListElement(point){
  function capitalizeFirstLetter(str){
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  var cont = "";
  cont += "<li class='watchPoint list-group-item ' id='" + point._id + "' data-toggle='collapse' data-target='#collapse"+point._id+"' data-parent='#points'>";
  cont += "<span>"+(point.message || point.placename)+"</span>";
  //- cont += "<button data-toggle='collapse' data-target='#collapse'>Details</button>"
  cont += "<button class='btn btn-danger btn-remove-point' id='"+point._id+"'>X</button>"
  cont += "<div class='panel-collapse collapse' id='collapse"+point._id+"'>"
  cont += "<span><strong>Condition:</strong> " + capitalizeFirstLetter(point.condition.type) + " " + point.condition.operator + " than " + point.condition.value + "</span><br>"
  cont+= "<a href='https://forecast.io/#/f/"+point.lat + ","+point.lng + "'>View Current Conditions </a>"
  //- cont+="<a href='http://forecast.io/#/f/49.8486,-122.8766'>Alt link</a>"
  cont += "</div>"
  cont += "</li>"

  $("ul#points").append(
    cont
  )
}

function addMarker(point){
  console.log(point)
  return new google.maps.Marker({
    icon:'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    position:{lat:+point.lat,lng:+point.lng},
    map:map
  })
}

function removeMarker(id){
  //var setPoints = setPoints || [];
  setPoints.forEach(function(el,i){
    if(el._id === id) setPoints[i].marker.setMap(null);
  })
}
