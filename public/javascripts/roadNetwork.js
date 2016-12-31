var roadNetwork = function() {
  this.init = function (mapUtil) {
    drawRoadNetwork(mapUtil);
    $('#KProvince').keyup(keyUpEvent);
  };

  var styleFunctionForRoadNetwork = function(feature, resolution) {
    return [new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'rgba(255, 255, 255, 1)', 
        // color: 'rgba(26, 90, 100, 1)', 
        width: 1
      }),
      fill:new ol.style.Fill({
            color: 'rgba(26, 90, 100, 0)',
      })
    })];
  };

  var drawRoadNetwork = function(mapUtil) {
    $.get('/query/clipRoadData', function(res) {
      mapUtil.drawOneLayer({geojsonObject: res, styleFunction: styleFunctionForRoadNetwork, 
                               option: {'dataProjection':'EPSG:4326','featureProjection':'EPSG:3857'},
                               name: 'roadNetwork'});
    }); 
  };

  function keyUpEvent(event) {
    if(event.keyCode != 13){
      ttt();
    }
  };

  return this;
}