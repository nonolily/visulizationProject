

var roadAnalysis = function(util) {
  this.init = function(query) {
    $('#checkPlaces').unbind('click', checkRoadSegement);

    $('#checkPlaces').click(checkRoadSegement);
  };

  function checkRoadSegement(query) {
    var query = {};
    var $check = $(":input[name=check]");
    var labels = [];

    $('.toggleLabel').each(function(item) {
      labels.push($(this).text());
    });

    if(labels.length == 0) {
      labels.push('all');
    }

    
    var roadNames = [];
    $check.each(function (item) {
      if($(this)[0].checked) {
        roadNames.push(util.English2Chinese($(this).val()));
      }
    });

    if(roadNames.length == 0) roadNames = util.roadNames;

    query.roadNames = roadNames;
    query.labels = labels;

    $.get('query/trafficJamDetection', query, function (res) {
      $('.colorBar').show()
      $('.colorBarText').show();
      $('.chooseDay').hide();
      $('#barchart').hide();
      roadSegemntPixelView(res);
    });
  };

  var saveToDatabase = function(data) {
    var roadData = [];
    for(var index in data) {

      roadData.push({
        name: index,
        polygon: data[index].polygon.geometry.coordinates[0]
      })
    }
    var query = {data: roadData};
    console.log(query);
    $.get('/query/saveRoadData', query, function(res) {
      console.log(res);
    })
  };

  var styleFunctionForRoadSegement = function(feature, resolution) {
    var type = feature.getGeometry().getType();
    var text = feature.getProperties()['text'];
    if('LineString' === type) {
      return [new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'gray',
          width: 0
        })
      })];
    }

    if(text) {
      return [new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'rgba(0, 0, 0, 0)',
          width: 1,
          lineDash: [20, 20, 20]
        }),
        fill: new ol.style.Fill({
          color: 'rgba(0, 0, 0, 0)'
        }),
        text: new ol.style.Text({
          font: '12px Wawati TC Regular',
          fill: new ol.style.Fill({
            color: 'gray'
          }),
          stroke: new ol.style.Stroke({
            color: 'rgba(0, 0, 0, 0)',
            width: 1
          }),
          text: util.Chinese2English(text)
        })
      })];
    }

    if('Polygon' === type) {
      var speed = feature.getProperties()['speed'];
      var day = feature.getProperties()['day'];
      var hour = feature.getProperties()['hour'];
      var colorString;
      var stroke;

      if(day == 8) {
        if(hour % 3 == 0) {
          return [new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: 'rgba(0, 0, 0, 0)',
              width: 0.5
            }),
            fill: new ol.style.Fill({
              color: 'rgba(0, 0, 0, 0)'
            }),
            text:  new ol.style.Text({
              font: '12px Calibri,sans-serif',
              fill: new ol.style.Fill({
                color: '#fff'
              }),
              stroke: new ol.style.Stroke({
                color: '#fff',
                width: 1
              }),
              text: hour
            })
          })];
        } else {
          return [new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: 'rgba(0, 0, 0, 0)',
              width: 0.5
            }),
            fill: new ol.style.Fill({
              color: 'rgba(0, 0, 0, 0)'
            })
          })];
        }
      }

      speed = parseFloat(speed);
      if(speed < 0) {
        speed = -speed;
      }

      if(speed == 0) {
        if(day > 5) {
          colorString = 'rgba(220, 220, 220, 1)'; 
        } else {
          colorString = 'rgba(200, 200,200, 1)'; 
        }
      } else {
        index = Math.ceil(speed / 1.5);
        if(index >= 15) index = 9;
        if(isNaN(index)) {
          console.log(speed, day, hour);
        }
        colorString = util.speedColorTable[index];
      }

      stroke = 'white';
     
      return [new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: stroke,
          width: 0.5
        }),
        fill: new ol.style.Fill({
          color: colorString
        })
      })];
    }
  };

  var getWeekSpeedInfo = function(result) {
    var weekSpeedInfo = {};
    var roadCount = {};
    for(var index in result) {
      var info = result[index].info;

      for(var date in info) {
        var dayInfo = info[date];
        date = date < 10 ? '0' + date : date;
        var day = (new Date('2014-08-' + date)).getDay();

        if(index in weekSpeedInfo) {
          if(day in weekSpeedInfo[index]) {
              for(var i in dayInfo) {
                weekSpeedInfo[index][day][i] += dayInfo[i];
              }

              for(var i in dayInfo) {
                if(dayInfo[i] != 0) roadCount[index][day][i] += 1;
              }

            } else {
              weekSpeedInfo[index][day] = dayInfo;

              roadCount[index][day] = [];

              for(i = 0; i < dayInfo.length; i ++) {
                if(dayInfo[i] != 0) roadCount[index][day][i] = 1;
                else roadCount[index][day][i] = 0;
              }
            } // end of if - day in weekSpeedInfo

        } else {
          weekSpeedInfo[index] = {};
          weekSpeedInfo[index][day] = [];
          for(var i = 0; i < 24; i ++) {
            weekSpeedInfo[index][day][i] = 0;
          }

          roadCount[index] = {};
          roadCount[index][day] = [];

          for(i = 0; i < dayInfo.length; i ++) {
            if(dayInfo[i] != 0) roadCount[index][day][i] = 1;
            else roadCount[index][day][i] = 0;
          }

        } // end of if - index in weekSpeedInfo
      }

    } // end of for - index in result
    weekSpeedInfo = averageRoadSpeed(weekSpeedInfo, roadCount)
    return weekSpeedInfo;
  };

  function averageRoadSpeed(roadData, roadCount) {
    for(index in roadData) {
      for(j in roadData[index]) {
        for(k = 0; k < roadData[index][j].length; k ++) {
          if(roadCount[index][j][k] != 0) {
            roadData[index][j][k] /= roadCount[index][j][k];
          }
        }
      }
    }
    return roadData;
  }

function updateCountArray(counts, speeds) {
  for(var i = 0; i < speeds.length; i ++) {
    if(speeds[i] != 0) {
      counts[i] ++;
    }
  }
  return counts;
}

function initCountArray(speeds) {
  var counts = [];
  for(var i = 0; i < speeds.length; i ++) {
    if(speeds[i] != 0) {
      counts[i] = 1;
    } else counts[i] = 0;
  }
  return counts;
}

function updateSpeedArray(oldSpeeds, speeds) {
  for(var i = 0; i < speeds.length; i ++) {
    if(speeds[i] != 0) {
      oldSpeeds[i] += speeds[i];
    }
  }
  return oldSpeeds;
}

  var drawRoadSegementArch = function(features, result) {
    var weekSpeedInfo = getWeekSpeedInfo(result);
    var N = 50;
    var delta = 360 / 24;
    var deltaAngle = delta / N;
    var height = 3;
    var radius = 5;
    var pointTmp, polygon;
    var margin = 4;
    var box;

    for(var index in result) {
      if(result.hasOwnProperty(index) && (typeof index !== 'undefined')) {
        var element = result[index];
        var centroid = element.centroid;
        var curve, startAngle, endAngle;
        box = [];

        var line = turf.lineString([centroid.geometry.coordinates, centroid.geometry.coordinates], {
          name: index,
          center: (new ol.format.GeoJSON()).readFeature(centroid, {'dataProjection':'EPSG:4326','featureProjection':'EPSG:3857'}),
          centroid: (new ol.format.GeoJSON()).readFeature(centroid, {'dataProjection':'EPSG:4326','featureProjection':'EPSG:3857'})
        });
        features.features.push(line);

        for(var i = 0; i < 24; i ++) {
          startAngle = delta * i;
          endAngle = delta * (i + 1);
          for(var j = 0; j < 8; j ++) {
            curve = [];
            var day = j == 7 ? 7 : (j == 0 ? 6 : j - 1);

            for(var k = 0; k < N; k ++) {
              pointTmp = turf.destination(centroid, resolution * (height * day + radius) / 500, startAngle + deltaAngle * k);
              curve[k] = pointTmp.geometry.coordinates;
              pointTmp = turf.destination(centroid, resolution * (height * (day + 1) + radius) / 500, startAngle + deltaAngle * k);
              curve[2 * N - k - 1] = pointTmp.geometry.coordinates;
            }

            pointTmp = turf.destination(centroid, resolution * (height * day + radius) / 500 , startAngle);
            curve.push(pointTmp.geometry.coordinates);

            polygon = turf.polygon([curve]);
            properties = {};
            properties.name = index;
            properties.top = top;
            properties.speed = 0;
            properties.day = day + 1;
            properties.hour = i;

            // 判断速度在该网格是否存在
            try{
              properties.speed = weekSpeedInfo[index][j][i];
            } catch(e) {
              properties.speed = 0;
            }
            polygon.properties = properties;
            features.features.push(polygon);

          } // end of for - j
        } // end of for - i
        var textWidth = index.length;
        box[0] = turf.destination(centroid, resolution * (height * 8 + radius + margin) / 500, 180);

        box[0] = turf.destination(box[0], resolution * (textWidth / 2) / 500, -90);
        box[1] = turf.destination(box[0], resolution * (textWidth) / 500, 90);
        box[2] = turf.destination(box[1], resolution * (1) / 500, 180);
        box[3] = turf.destination(box[0], resolution * (1) / 500, 180);
        box = turf.envelope(turf.featureCollection(box));
        properties = {
          name: index,
          text: index
        };
        box.properties = properties;
        features.features.push(box);

      }// end of if - index 
    } // end of for - index

    // util.addVectorLayer({geojsonObject: features, styleFunction: styleFunctionForRoadSegement});
  };

  var drawRoadSegementRect = function(features, result) {
    var width = 4, height = 2, fontHeight = 10;
    var l = 20, bearing, distance;
    var coords = [];
    var box = null,  properties = {}, day;
    var boxWeekend = {}, isWeekend = false;
    for(var index in result) {
      if(result.hasOwnProperty(index) && (typeof index !== 'undefined')) {
        boxWeekend[index] = {data:[], days: []};
        var pixelFeatureCollection = [];
        var element = result[index];
        var box;
        var points = element.points;
        var centroid = element.centroid;
        var destination = turf.destination(centroid, l * resolution / 500, 45, 'kilometers');
        var center = turf.point([(centroid.geometry.coordinates[0] + destination.geometry.coordinates[0]) / 2, 
                                 (centroid.geometry.coordinates[1] + destination.geometry.coordinates[1]) / 2], 
                                 { name: index });

        var top = turf.destination(center, 15 * height * resolution / 500, 0, 'kilometers');
        coords[0] = top;
        coords[1] = turf.destination(coords[0], width * 31 * resolution / 500, 90, 'kilometers');
        coords[2] = turf.destination(coords[1], height * 24 * resolution / 500, 180, 'kilometers');
        coords[3] = turf.destination(coords[0], height * 24 * resolution / 500, 180, 'kilometers');
        var box_ = turf.envelope(turf.featureCollection(coords));

        coords[0] = turf.destination(top, 1 * resolution / 500, 0, 'kilometers');;
        coords[1] = turf.destination(coords[0], index.length * 12 * 3 / 5 * resolution / 500, 90, 'kilometers');
        coords[2] = turf.destination(coords[1], (fontHeight * resolution) / 500, 0, 'kilometers');
        coords[3] = turf.destination(coords[0], (fontHeight * resolution) / 500, 0, 'kilometers');
        var text = turf.envelope(turf.featureCollection(coords));
        text.properties = {
          text: index,
          name: index,
        };
        features.features.push(text);

        var line = turf.lineString([centroid.geometry.coordinates, center.geometry.coordinates], {
          name: index,
          center: (new ol.format.GeoJSON()).readFeature(center, {'dataProjection':'EPSG:4326','featureProjection':'EPSG:3857'}),
          box: (new ol.format.GeoJSON()).readFeature(box_, {'dataProjection':'EPSG:4326','featureProjection':'EPSG:3857'}),
          centroid: (new ol.format.GeoJSON()).readFeature(centroid, {'dataProjection':'EPSG:4326','featureProjection':'EPSG:3857'})
        });

        for(var i = 0; i < 31; i ++) {
          var dateString = '2014-08-';
          isWeekend = false;

          if((i + 1) < 10) dateString += '0' + (i + 1).toString();
          else dateString += (i + 1).toString();

          day = (new Date(dateString)).getDay();
          
          if(day == 0 || day == 6) {
            boxWeekend[index]['data'][i] = [];
            isWeekend = true;
          }

          for(var j = 0; j < 24; j ++) {
           
            distance = Math.sqrt(Math.pow(i * width * resolution / 500, 2) + Math.pow(j * height * resolution / 500, 2));

            if(i == 0)  {
              bearing = 180;
            } else {
              bearing = Math.atan((j * height) / (i * width)) * 180 / Math.PI + 90;
            } 

            coords[0] = turf.destination(top, distance, bearing, 'kilometers');
            coords[1] = turf.destination(coords[0], width * resolution / 500, 90, 'kilometers');
            coords[2] = turf.destination(coords[1], (height + 1) * resolution / 500, 180, 'kilometers');
            coords[3] = turf.destination(coords[0], (height + 1) * resolution / 500, 180, 'kilometers');
            box = turf.envelope(turf.featureCollection(coords));

            properties = {};
            properties.name = index;
            properties.top = top;
            properties.speed = 0;
            properties.day = i + 1;
            if(element['info'][i]) {
              if(element['info'][i][j]) {
                properties.speed = element['info'][i][j]['speed'];
                if(!element['info'][i][j]['speed']) {
                  properties.speed = element['info'][i][j]['speed'];
                }
              }
            }
            box.properties = properties;
            features.features.push(box);
          } // end of for - j

          if(isWeekend) {
            boxWeekend[index]['days'][i] = day;
          }
        } // end of for - i 
        features.features.push(line);
      } // end of if
    }// end of for - index
  };

  var getDragInteraction = function (features, dragCursor) {
      var handleMoveEvent = function(event){
          if (dragCursor) {
              var map = event.map;
              var feature = map.forEachFeatureAtPixel(event.pixel,
                  function(feature, layer) {
                    return feature;
                  });
              var element = event.map.getTargetElement();
              if (feature) {
                  if (element.style.cursor != dragCursor) {
                      dragPrevCursor = element.style.cursor;
                      element.style.cursor = dragCursor;
                  }
              } else if (dragPrevCursor !== undefined) {
                  element.style.cursor = dragPrevCursor;
                  dragPrevCursor = undefined;
              }
          }
      };

      var handleDragEvent = function(event){
          var deltaX = event.coordinate[0] - dragCoordinate[0];
          var deltaY = event.coordinate[1] - dragCoordinate[1];
      
          for(var index in features) {
            if(features[index]) {
              if(name === features[index].getProperties()['name']) {
                if('Polygon' === features[index].getGeometry().getType()) {
                  features[index].getGeometry().translate(deltaX, deltaY);
                } else if('LineString' === features[index].getGeometry().getType()) {

                  var centroid = JSON.parse((new ol.format.GeoJSON()).writeFeature(features[index].getProperties()['centroid'], {'dataProjection':'EPSG:4326','featureProjection':'EPSG:3857'}));
                  
                  var centerFeature = features[index].getProperties()['center']; 
                  centerFeature.getGeometry().translate(deltaX, deltaY);

                  var center = JSON.parse((new ol.format.GeoJSON()).writeFeature(centerFeature, {'dataProjection':'EPSG:4326','featureProjection':'EPSG:3857'}));
                  var distance = turf.distance(center, centroid, 'kilometers') * 500 / resolution;
                  var radius = 5 + 3 * 8;

                  var bearing = Math.atan((features[index].getGeometry().j[1] - centerFeature.getGeometry().j[1]) / (features[index].getGeometry().j[0] - centerFeature.getGeometry().j[0])) / Math.PI * 180;

                  if(center.geometry.coordinates[0] > centroid.geometry.coordinates[0] && center.geometry.coordinates[1] < centroid.geometry.coordinates[1]) {
                    bearing = -bearing - 90;
                  } else if(center.geometry.coordinates[0] < centroid.geometry.coordinates[0] && center.geometry.coordinates[1] < centroid.geometry.coordinates[1]) {
                    bearing = 90 - bearing;
                  } else if(center.geometry.coordinates[0] < centroid.geometry.coordinates[0] && center.geometry.coordinates[1] > centroid.geometry.coordinates[1]) {
                    bearing = 90 - bearing;
                  }else { 
                    bearing = 270 - bearing;
                  }
                  var borderFeature = turf.destination(center, resolution * radius / 500, bearing, 'kilometers');
                  borderFeature = (new ol.format.GeoJSON()).readFeature(borderFeature, {'dataProjection':'EPSG:4326','featureProjection':'EPSG:3857'});

                  var destination = distance < radius ? centerFeature : borderFeature;
                  features[index].getGeometry().j[2] = destination.getGeometry().j[0];
                  features[index].getGeometry().j[3] = destination.getGeometry().j[1];

                } else if('Point' === features[index].getGeometry().getType()){
                  features[index].getGeometry().translate(deltaX, deltaY);
                } // end of if - type
              }// end of if - name
            } // end of if feature[index]
          } // end of for - index 
          dragCoordinate[0] = event.coordinate[0];
          dragCoordinate[1] = event.coordinate[1];
      };

      var handleUpEvent = function(event){
          dragCoordinate = null;
          dragFeature = null;
          return false;
      };
      var handleDownEvent = function(event){
          var feature = util.map.forEachFeatureAtPixel(event.pixel,    
              function(feature, layer) {
                  return feature;
              }
          );
          if(feature){
              name = feature.getProperties()['name'];
              dragCoordinate = event.coordinate;
              dragFeature = feature;
              return true;
          }
          
          return false;
      };

      return new ol.interaction.Pointer({
        handleDownEvent: handleDownEvent,
        handleDragEvent: handleDragEvent,
        handleMoveEvent: handleMoveEvent,
        handleUpEvent: handleUpEvent
      });
  };
  
  var roadSegemntPixelView = function(result) {
      util.clear();
      var dragFeature = null;
      var dragCoordinate = null;
      var dragCursor = 'pointer';
      var dragPrevCursor = null;
      var name;
      var features = {
        'type': 'FeatureCollection',
        'features': []
      };

      getWeekSpeedInfo(result);

      resolution = util.map.getView().getResolution();
      drawRoadSegementArch(features, result);
      features = (new ol.format.GeoJSON()).readFeatures(features, {'dataProjection':'EPSG:4326','featureProjection':'EPSG:3857'});
      var dragInteraction = getDragInteraction(features);
      util.map.addInteraction(dragInteraction);
      util.addVectorLayer({geojsonObject: features, styleFunction: styleFunctionForRoadSegement, isFeature: true});
      util.draw();
  };

  return this;
};

// for(var i = 0; i < 24; i ++) {
        //   startAngle = delta * i;
        //   endAngle = delta * (i + 1);
        //   for(var j = 0; j < 31; j ++) {
        //     curve = [];
        //     for(var k = 0; k < N; k ++) {
        //       pointTmp = turf.destination(centroid, resolution * (height * j + radius) / 500, startAngle + deltaAngle * k);
        //       curve[k] = pointTmp.geometry.coordinates;
        //       pointTmp = turf.destination(centroid, resolution * (height * (j + 1) + radius) / 500, startAngle + deltaAngle * k);
        //       curve[2 * N - k - 1] = pointTmp.geometry.coordinates;
        //     }

        //     pointTmp = turf.destination(centroid, resolution * (height * j + radius) / 500 , startAngle);
        //     curve.push(pointTmp.geometry.coordinates);

        //     polygon = turf.polygon([curve]);
        //     properties = {};
        //     properties.name = index;
        //     properties.top = top;
        //     properties.speed = 0;
        //     properties.day = j + 1;

        //     // 判断速度在该网格是否存在
        //     if(element['info'][j]) {
        //       if(element['info'][j][i]) {
        //         if(element['info'][j][i]['speed']) {
        //           properties.speed = element['info'][j][i]['speed'];
        //         } 
        //       }
        //     }
        //     polygon.properties = properties;
        //     features.features.push(polygon);
        //   } // end of for - j
        // } // end of for - i

// features[index].getProperties()['box'].getGeometry().translate(deltaX, deltaY);
//                   var centroid = JSON.parse((new ol.format.GeoJSON()).writeFeature(features[index].getProperties()['centroid'], {'dataProjection':'EPSG:4326','featureProjection':'EPSG:3857'}));
//                   var box = JSON.parse((new ol.format.GeoJSON()).writeFeature(features[index].getProperties()['box'], {'dataProjection':'EPSG:4326','featureProjection':'EPSG:3857'}));
//                   var bl = turf.point(box.geometry.coordinates[0][0]); 
//                   var br = turf.point(box.geometry.coordinates[0][1]); 
//                   var tr = turf.point(box.geometry.coordinates[0][2]); 
//                   var tl = turf.point(box.geometry.coordinates[0][3]);
//                   var destination = null;

//                   if(centroid.geometry.coordinates[0] < tl.geometry.coordinates[0] &&
//                      centroid.geometry.coordinates[0] < bl.geometry.coordinates[0] &&
//                      centroid.geometry.coordinates[0] < br.geometry.coordinates[0] &&
//                      centroid.geometry.coordinates[0] < tr.geometry.coordinates[0]) {
//                     destination = turf.midpoint(tl, bl);
//                   } else if(centroid.geometry.coordinates[0] > tl.geometry.coordinates[0] &&
//                      centroid.geometry.coordinates[0] > bl.geometry.coordinates[0] &&
//                      centroid.geometry.coordinates[0] > br.geometry.coordinates[0] &&
//                      centroid.geometry.coordinates[0] > tr.geometry.coordinates[0]) {
//                     destination = turf.midpoint(tr, br);
//                   } else if(centroid.geometry.coordinates[1] < tl.geometry.coordinates[1] &&
//                      centroid.geometry.coordinates[1] < bl.geometry.coordinates[1] &&
//                      centroid.geometry.coordinates[1] < br.geometry.coordinates[1] &&
//                      centroid.geometry.coordinates[1] < tr.geometry.coordinates[1]) {
//                     destination = turf.midpoint(bl, br);
//                   } else if(centroid.geometry.coordinates[1] > tl.geometry.coordinates[1] &&
//                      centroid.geometry.coordinates[1] > bl.geometry.coordinates[1] &&
//                      centroid.geometry.coordinates[1] > br.geometry.coordinates[1] &&
//                      centroid.geometry.coordinates[1] > tr.geometry.coordinates[1]) {
//                     destination = turf.midpoint(tl, tr);
//                   } else {
//                     destination = centroid;
//                   }
                  
//                   destination = (new ol.format.GeoJSON()).readFeature(destination, {'dataProjection':'EPSG:4326','featureProjection':'EPSG:3857'});
//                   features[index].getGeometry().j[2] = destination.getGeometry().j[0];
//                   features[index].getGeometry().j[3] = destination.getGeometry().j[1];
