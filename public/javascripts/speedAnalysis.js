var speedAnalysis = function(util) {
  var speedInfo = {};

  var circles = [];
  var points = [];
  var circleTimeStamp = [];
  dynamicArr = [];
  dynamicDate = [];
  dynamicArr = [];
  var carDate = [];
  var carData = [];
  
  var layerNum = 0;
  var layerArr = [];
  var carpTime = [];
  var speedStyles = {};
  var allTraces = [];

  var date = '2014-08-09';
  var count = 0;
  var data = carData[date];

  speedInfo.init = function(query) {
    drawLinesBasedOnSpeed(query);
  }

  var styleFunctionForSpeedAnalysis = function(feature, resolution) {
    var speed = Math.round(feature.getProperties ()['speed']);
    var max = Math.round(feature.getProperties ()['max']);

    var color = Color(speed, max);
    var colorString = 'rgba(' + color.R + ',' + color.G + ',' + color.B + ', 0.2)';
    var style =  [new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: colorString,
        width: 2
      })
    })];
    return style;
  };

  var drawLinesBasedOnSpeed = function (query) {
    $.get('/query/getSpeed', query, function (response) {
      carData = response['data'];
      carDate = response['date'];
      maxSpeed = response['maxSpeed'];
      $("#sidebar_loader")[0].style.display="one";
      var checkBox = $("#car_date")[0];
      checkString = "";
      for (var i = 0; i < carDate.length; i++){
        checkString += "<input type='checkbox' onclick=showCarGIS(this.value) value='"+carDate[i]+"'>"+carDate[i]+"</br>"; // 显示选中的出租车轨迹示复选框
      }
      checkString += "<input type='checkbox' onclick=showCarGIS(this.value) value='all'>" + ' all' + "</br>"; 
      checkBox.innerHTML = checkString;
      initSpeed(carDate, carData, maxSpeed);
      animation(response);
    });
  };

  var showCarGIS = function(str){ // 显示选中的出租车轨迹
    var checkContainer = $("#car_date")[0]
    children = checkContainer.children
    for (var i =0; i <children.length; i+=2){ // 为什么是i+=2
      if (children[i].value == str){
        if (children[i].checked == true){
          // util.map.addLayer(layerArr[i]);
          drawLines(str);
        }else{
          // util.map.getLayers().remove(layerArr[i])
          clearLine(str);
        }
      }
    } 
  };

  var initSpeed = function (carDate, carData, maxSpeed) {
    for(var i = 0; i < carDate.length; i++) {
      var max = 0;
      carpTime[i] = carData[carDate[i]]['ptime'];
      var points = carData[carDate[i]]['location'];
      var speeds = carData[carDate[i]]['speed'];
      var timestamps = carData[carDate[i]]['timestamp'];

      var geojsonObject = {
        'type': 'FeatureCollection',
        'crs': { // 坐标参考系统的对象
          'type': 'name',
          'properties': {
            'name': 'EPSG:3857'
          }
        },
        'features': []
      };

      for (var d =0;d< points.length; d++){
        max = max > speeds[d] ? max : speeds[d];
      }

      for(var d = 0; d < points.length; d ++) {
        tmpX1 = points[d][0][0];
        tmpY1 = points[d][0][1];

        tmpX2 = points[d][1][0];
        tmpY2 = points[d][1][1];

        transPoint1 = ol.proj.transform([tmpX1 - 0.0025, tmpY1 + 0.0025],'EPSG:4326','EPSG:3857');
        transPoint2 = ol.proj.transform([tmpX2 - 0.0025, tmpY2 + 0.0025],'EPSG:4326','EPSG:3857');

        geojsonObject.features.push(turf.lineString([transPoint1, transPoint2], { 'speed': speeds[d],
                                                                                  'max': max }));

        allTraces.push(turf.lineString([transPoint1, transPoint2], { 'speed': speeds[d],
                                                                     'max': 45 }));
        points[d] = [transPoint1[0],transPoint1[1]];
      }

      geojsonObject.features = geojsonObject.features.sort(function (a, b) {
        return a.properties.speed - b.properties.speed;
      });

      circles[i] = {points: points, speeds: speeds};
      dynamicArr[i] = 0
      circleTimeStamp[i] = carData[carDate[i]]['timestamp'];
      util.addVectorLayer({geojsonObject: geojsonObject, styleFunction: styleFunctionForSpeedAnalysis});
    }
  };

  var Color = function (speed, max) {
    var H = getH(speed, max) ;
    var S = 1;
    var B = 1;
    return HSB_2_RGB(H, S, B);
  };

  var getH = function (speed, max) {
    var H = parseFloat(speed / max) >= 1 ? 0.99999 : parseFloat(speed / max);
    return H * 180;
  };

  var HSB_2_RGB = function(H, S, B) { 
      // H = H * 360;
      // S = S * 100;
      // B = B * 100;
      var rgb = {R:0, G:0, B:0};  
      H = (H >= 360) ? 0 : H;  

      if(S == 0) {  
          rgb.R = B * 255;  
          rgb.G = B * 255;  
          rgb.B = B * 255;  
      } else {  
          i = Math.floor(H / 60) % 6;  
          f = H / 60 - i;  
          p = B * (1 - S);  
          q = B * (1 - S * f);  
          t = B * (1 - S * (1 - f));  
          switch(i) {  
                  case 0:  
                      rgb.R = B, rgb.G = t, rgb.B = p;  
                      break;  
                  case 1:  
                      rgb.R = q; rgb.G = B; rgb.B = p;  
                      break;  
                  case 2:  
                      rgb.R = p; rgb.G = B; rgb.B = t;  
                      break;  
                  case 3:  
                      rgb.R = p; rgb.G = q; rgb.B = B;  
                      break;  
                  case 4:  
                      rgb.R = t; rgb.G = p; rgb.B = B;  
                      break;  
                  case 5:  
                      rgb.R = B; rgb.G = p; rgb.B = q;  
                      break;  
              }  
          rgb.R = rgb.R * 255;  
          rgb.G = rgb.G * 255;  
          rgb.B = rgb.B * 255;  
      }  
      return rgb;  
  };  
   
  var RGB_2_HSB = function(R, G, B) {  
      var var_Min = Math.min(Math.min(R, G), B);  
      var var_Max = Math.max(Math.max(R, G), B);  
      var hsb = {H:0, S:0, B:0};  
      if(var_Min == var_Max) {  
          hsb.H = 0;  
      } else if(var_Max == R && G >= B) {  
          hsb.H = 60 * ( (G - B) / (var_Max - var_Min) );  
      } else if(var_Max == R && G < B) {  
          hsb.H = 60 * ( (G - B) / (var_Max - var_Min) ) + 360;  
      } else if(var_Max == G) {  
          hsb.H = 60 * ( (B - R) / (var_Max - var_Min) ) + 120;  
      } else if(var_Max == B) {  
          hsb.H = 60 * ( (R - G) / (var_Max - var_Min) ) + 240;  
      }  
      if(var_Max == 0) {  
          hsb.S = 0;  
      } else {  
          hsb.S = 1 - (var_Min / var_Max);  
      }  
      var var_R = (R / 255);  
      var var_G = (G / 255);  
      var var_B = (B / 255);  
      hsb.B = Math.max(Math.max(var_R, var_G), var_B);
      hsb.H = (hsb.H >= 360) ? 0 : hsb.H;  
      return hsb;  
  }; 

  var headInnerImageStyle = new ol.style.Style({
    image: new ol.style.Circle({
      radius: 2,
      snapToPixel: false,
      fill: new ol.style.Fill({color: 'blue'})
    })
  });

  var headOuterImageStyle = new ol.style.Circle({
    radius: 5,
    snapToPixel: false,
    fill: new ol.style.Fill({color: 'black'})
  });

  var showCarInfo = function(data,styles,currentTimes){
    var dataLength = styles.length;
    var tableValue = "<table>    <tbody style='margin: 0 auto' align='center' >        <thead>        <tr>                <th>Date</th>          <th>degree</th>      <th>&nbsp;&nbsp;speed</th>                                <th>time</th>           </tr>       </thead> "
    for(var i = 0;i < dataLength;i++){
      tableValue += "<tr>"
      tableValue += "<td>"+dynamicDate[i]+"</td>";
      tableValue += "<td>"+styles[i][0] + "</td>";
      tableValue += "<td>"+styles[i][1] + "</td>";
      tableValue += "<td>"+currentTimes[i] + "</td>";
      tableValue += "</tr>"
    }
    tableValue +="</tbody></table>"
    $("#car_info")[0].innerHTML = tableValue
  }

  var getSpecificStyle = function(degree,colorIndex){
    redIndex = 255-colorIndex + 100; 
    greenIndex = colorIndex + 155;
    colorString = 'rgba('+redIndex+','+greenIndex+',0,1)';

    specificStyle = new ol.style.Style({
      image: new ol.style.RegularShape({
        fill: new ol.style.Fill({color: colorString}),
        stroke: new ol.style.Stroke({color: 'black', width: 0.000001}),
        points: 6,
        radius: 10,
        rotation: Math.PI / 180 * degree,
        angle: 10
      })
    });
    return specificStyle
  }

  var n = 200;
  var omegaTheta = 300; // 控制地图上动画的速度
  var R = 7e6;
  var r = 2e6;
  var p = 2e6;

  xChange = 0
  yChange = 0

  var animation = function(result) {
    var data = result.data['2014-08-09']['location'];
    var count = 0;
    var vectorContext = event.vectorContext;
    var frameState = event.frameState;
    var percent = 0;
    var coordiantes = [];
    var i = 0;
    var allDataStyle = [];
    var allData = {};
    var speed = {};
    var dynamicDate = [];
    var allPTime = [];
    var pointsLen, singleSpeed, singleDegree, lengthX, lengthY, tmpX, tmpY, tmpY1, tmpX1, tmpY2, tmpX2;

    util.clear();

    function animationEvent(event) {
      var vectorContext = event.vectorContext;
      var frameState = event.frameState;
      var N = 10;
      var startPoint, endPoint;

      i = 0;
      points = circles[i].points;
      pointsLen = circles[i].points.length - 2;
      modPOintPosition = Math.ceil((frameState.time / 100) % pointsLen);
      modPoint = circles[i]['points'][modPOintPosition];
      modPointNext = circles[i]['points'][modPOintPosition+1];
      points = [modPoint, modPointNext];
      pointsTime = [circleTimeStamp[i][modPOintPosition]];

      if(count < circles[0]['points'].length - 1) {
        startPoint = circles[0]['points'][count];
        endPoint = circles[0]['points'][++ count];
        if (singleDegree < 0){
          singleDegree += 360;
        }
        //check this degree is exist or not
        if (allData[singleDegree] == null){
          allData[singleDegree] = {}
        }
        singleSpeed = Math.ceil(Math.sqrt(lengthX * lengthX + lengthY * lengthY) / pointsTime[i] * 10)
        //singleSpeed = (Math.sqrt(lengthX * lengthX + lengthY * lengthY) / pointsTime[i] )

        if (singleSpeed == NaN){
          console.log([points[i],points[i+1]])
        }

        if (speed[singleSpeed] == null){
          speed[singleSpeed] = 1;
        }else{
          speed[singleSpeed] += 1;     
        }
        
        if (singleSpeed >= 255){
          singleSpeed = 255
        }
        if (allData[singleDegree][singleSpeed] == null){
          allDataStyle.push([singleDegree,singleSpeed])
          allData[singleDegree][singleSpeed] = []
          allData[singleDegree][singleSpeed].push([tmpX,tmpY])
        }else{
          allData[singleDegree][singleSpeed].push([tmpX,tmpY] );  
        }
      }

      for (var i =0; i < allDataStyle.length ; i++){
        singleDegree = allDataStyle[i][0];
        singleSpeed = allDataStyle[i][1];
        var headPoint = new ol.geom.MultiPoint( allData[singleDegree][singleSpeed] )//coordinates[coordinates.length - 1]);
        var headFeature = new ol.Feature(headPoint);
        vectorContext.drawFeature(headFeature, getSpecificStyle(singleDegree,singleSpeed));
        vectorContext.drawMultiPointGeometry(headPoint, null);
      }
      util.map.render();
    }

    util.map.on('postcompose', animationEvent);

    // util.map.on('postcompose', function(event) {
    //   var vectorContext = event.vectorContext;
    //   var frameState = event.frameState;
    //   var percent = 0;
    //   var coordiantes = [];
    //   var i;
    //   var allDataStyle = [];
    //   var allData = {};
    //   var speed = {};
    //   var dynamicDate = [];
    //   var allPTime = [];
    //   var pointsLen;

    //   for(var i = 0; i < circles.length; i ++) {
    //     if(dynamicArr[i] == i) {
    //       dynamicDate.push(carDate[i]);
    //       points = circles[i].points;
    //       pointsLen = circles[i].points.length - 2;
    //       modPOintPosition = Math.ceil((frameState.time / 100) % pointsLen);
    //       modPoint = circles[i]['points'][modPOintPosition];
    //       modPointNext = circles[i]['points'][modPOintPosition+1];
    //       points = [modPoint , modPointNext];
    //       pointsTime = [circleTimeStamp[i][modPOintPosition]];

    //       for (var j = 0; j < points.length - 1; j ++) {
    //         lengthX = (points[j + 1][0] - points[j][0]);
    //         lengthY = (points[j + 1][1] - points[j][1]);
    //         tmpX = points[i][0] + (points[j + 1][0] - points[j][0]) * percent - xChange;
    //         tmpY = points[i][1] + (points[j + 1][1] - points[j][1]) * percent - yChange;
    //         singleDegree = Math.ceil(Math.atan2(lengthY, lengthX)/(Math.PI/180))
    //         if (singleDegree < 0){
    //           singleDegree += 360;
    //         }
    //         //check this degree is exist or not
    //         if (allData[singleDegree] == null){
    //           allData[singleDegree] = {}
    //         }
    //         singleSpeed = Math.ceil(Math.sqrt(lengthX * lengthX + lengthY * lengthY) / pointsTime[i] * 10)
    //         //singleSpeed = (Math.sqrt(lengthX * lengthX + lengthY * lengthY) / pointsTime[i] )

    //         if (singleSpeed == NaN){
    //           console.log([points[i],points[i+1]])
    //         }

    //         if (speed[singleSpeed] == null){
    //           speed[singleSpeed] = 1;
    //         }else{
    //           speed[singleSpeed] += 1;     
    //         }
            
    //         if (singleSpeed >= 255){
    //           singleSpeed = 255
    //         }
    //         if (allData[singleDegree][singleSpeed] == null){
    //           allDataStyle.push([singleDegree,singleSpeed])
    //           allData[singleDegree][singleSpeed] = []
    //           allData[singleDegree][singleSpeed].push([tmpX,tmpY])
    //         }else{
    //           allData[singleDegree][singleSpeed].push([tmpX,tmpY] );  
    //         }
    //       } // end of for - j 
    //     } // end of if - (dynamicArr[c] == 1)
    //   } // end of for - i
    //   if (allDataStyle == false){
    //     return 
    //   }
    //   for (var i =0; i < allDataStyle.length ; i++){
    //     singleDegree = allDataStyle[i][0];
    //     singleSpeed = allDataStyle[i][1];
    //     var headPoint = new ol.geom.MultiPoint( allData[singleDegree][singleSpeed] )//coordinates[coordinates.length - 1]);
    //     var headFeature = new ol.Feature(headPoint);
    //     vectorContext.drawFeature(headFeature, getSpecificStyle(singleDegree,singleSpeed));
    //     vectorContext.drawMultiPointGeometry(headPoint, null);
    //   }
    //   util.map.render();
    // });
  } // end of function - animation

  
  return speedInfo;
};




























