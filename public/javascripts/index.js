$(function() {
  // 地图工具类初始化
  var mapUtil = new utility();
  mapUtil.setMap({
      layers: [],
      target: 'map',
      view: new ol.View({
        // center: ol.proj.transform([103.996952, 30.659083],'EPSG:4326','EPSG:3857'), 
        center: ol.proj.transform([104.064745, 30.678892],'EPSG:4326','EPSG:3857'),
        zoom: 12
      })
  });

  // 底层路网初始化
  var cdRoadNetwork = new roadNetwork();
  cdRoadNetwork.init(mapUtil);

  // 道路分析初始化
  var road = new roadAnalysis(mapUtil);
  road.init();

  // 区域分析初始化
  var district = new districtAnalysis(mapUtil);
  district.init();

  $('.ol-zoom-out').hide();
  $('.ol-zoom-in').hide();
  $('.colorBar').hide();
  $('.colorBarText').hide(); 
  $('.chooseDay').hide(); 
  $('.ol-attribution').hide();
  $('#barchart').hide();

// test


});



  // road.init({labels: ['A-TA001'], roadNames: ['顺城大街']});
  // road.init({labels: ['A-TA001'], roadNames: ['顺城大街', '九里堤北路','北站西二路', '清江东路', '金河路', '临江路', '人民西路',  
  //        '一环路西一段','武侯大道', '科华路', '锦里东路','解放路一段', '锦里西路', '', '滨江中路', 
  //        '一环路西一段', '一环路南四段', '一环路南三段', '大慈寺路', '晋阳路', '龙腾路', '新南路', 
  //        '科华路', '驷马桥街', '锦里中路', '锦里东路']});