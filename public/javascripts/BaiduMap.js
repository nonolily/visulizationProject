var carData;
var carDate;
var layerNum = 0;
var layerArr = [];
var carpTime = [];
var set = $("#KProvince").offset();
var input = document.getElementById("search_suggest");
input.style.left = set['left'];
input.style.top = set['top']-20;
var speedStyles = {};
var polylines = {};
var heatmapOverlay;
`
// 按下Enter键之后刷新页面
function refresh (value){
  console.log(value);
  $("#sidebar_loader")[0].style.display="";
  $("#car_date")[0].innerHTML = "";
  var query = {};
  query.label = value;

  $.get('/query/getSpeed', query, function (response) {
    carData = response['data'] // 获得查询车辆的经纬度
    carDate = response['date'] // 获得查询车辆的信息
    $("#sidebar_loader")[0].style.display="none";
    var checkBox = $("#car_date")[0];
    checkString = "<input type='checkbox' onclick=showCarGIS(this.value) value='all'>"+ 'all' +"</br>";
    
    for(var i = 0; i < 7; i ++) {
      checkString += "<input type='checkbox' onclick=showCarGIS(this.value) value='"+ (i + 1) +"'>"+(i + 1)+"</br>"; // 显示选中的出租车轨迹示复选框
    }

    checkBox.innerHTML = checkString;
    // showHeatMap(carDate, carData);
    initSpeed(carDate,carData);
  });
}

function showCarGIS(str){ // 显示选中的出租车轨迹
  var checkContainer = $("#car_date")[0]
  children = checkContainer.children
  for (var i =0; i <children.length; i+=2){ // 为什么是i+=2
    console.log(children[i].value);
    if (children[i].value == str){
      if (children[i].checked == true){
        map.addOverlay(polylines[str].polyline);
       }else{
        map.removeOverlay(polylines[str].polyline);
      }
    }
  }
}

function showHeatMap(carDate, carData) {
  var query = {'label': 'A-TA001'}
  $.get('/query/heatmapData', query, function (response) {

    heatmapOverlay = new BMapLib.HeatmapOverlay({"radius":15});
    map.addOverlay(heatmapOverlay);
    max = -1;
    for(i in response) {
      max = max > response[i].count ? max : response[i].count;
    }
    heatmapOverlay.setDataSet({data:response,max:100});
    openHeatmap();
  });
  
}

function openHeatmap(){
      heatmapOverlay.show();
  }
function closeHeatmap(){
      heatmapOverlay.hide();
  }
  function setGradient(){
    /*格式如下所示:
  {
      0:'rgb(102, 255, 0)',
    .5:'rgb(255, 170, 0)',
      1:'rgb(255, 0, 0)'
  }*/
    var gradient = {};
    var colors = document.querySelectorAll("input[type='color']");
    colors = [].slice.call(colors,0);
    colors.forEach(function(ele){
    gradient[ele.getAttribute("data-key")] = ele.value; 
    });
      heatmapOverlay.setOptions({"gradient":gradient});
  }

function initSpeed(carDate, carData) {
  var tempPolylines = {all: {coordinates: [], speeds: [] }};

  for(var i = 0; i < carDate.length; i++) {
    var max = 0;
    carpTime[i] = carData[carDate[i]]['ptime'];
    var points = carData[carDate[i]]['location'];
    var speeds = carData[carDate[i]]['speed'];
    var timestamps = carData[carDate[i]]['timestamp'];  

    var day = new Date(carDate[i]).getDay();
    if(day == 0) day = 7;

    if(!(day in tempPolylines)) {
      tempPolylines[day] = {coordinates: [], speeds: []};
    } 

    for (var d =0;d< points.length; d++){
      max = max > speeds[d] ? max : speeds[d];
    }

    for(var d = 0; d < points.length; d ++) {
      tmpX1 = points[d][0][0];
      tmpY1 = points[d][0][1];

      tmpX2 = points[d][1][0];
      tmpY2 = points[d][1][1];

      transPoint1 = new BMap.Point(tmpX1,tmpY1);   
      transPoint2 = new BMap.Point(tmpX2,tmpY2); 

      // transPoint1.lat += 0.006;
      // transPoint1.lng += 0.0065;
      // transPoint2.lat += 0.006;
      // transPoint2.lng += 0.0065;

      tempPolylines[day].coordinates.push(transPoint1, transPoint2);
      tempPolylines[day].speeds.push(speeds[d]);

      tempPolylines.all.coordinates.push(transPoint1, transPoint2);
      tempPolylines.all.speeds.push(speeds[d]);
    }

// 一天的数据占一层
    polylines[day] = { polyline: new BMap.Polyline(
                                    tempPolylines[day].coordinates,
                                   {strokeColor:'rgb(200, 35, 45)', strokeWeight:1, strokeOpacity:0.3} )};

  }
  polylines['all'] = { polyline: new BMap.Polyline(
                                    tempPolylines['all'].coordinates,
                                   {strokeColor:'rgb(200, 35, 45)', strokeWeight:1, strokeOpacity:0.15} )};
  console.log();
}
