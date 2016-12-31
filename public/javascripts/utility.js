var utility = function() {
	var util = {};
	util.layerArr = [];
	util.map = {};
	var count = 0;

	util.roadNames = ["解放路一段", "新南路", "大慈寺路", "一环路南三段", "一环路南四段", "滨江中路", "一环路西一段", "科华路", "锦里中路", "清江东路", "锦里西路", "北站西二路", "临江路", "锦里东路", "顺城大街", "晋阳路", "九里堤北路", "武侯大道", "金河路", "人民西路"];
	var wordMapEnglish = {
			QingYang: {
				'Shun Cheng Street': '顺城大街', 
				'Qingjiang East Road': '清江东路',
				'Jinhe Road': '金河路',
				'Renmin West Road': '人民西路',
				'First Section of West NO.1 Circling Road': '一环路西一段',
				'East Jinli Road': '锦里东路',
				'West Jinli Road': '锦里西路',
				'Middle Jinli Road':'锦里中路'
			},
			JinNiu: {
				'North Station West Second Road': '北站西二路',
				'Jiulidi Road North': '九里堤北路',
				'Jiefang Road(section 1)': '解放路一段',
				// 'Simaqiao Street':''
			},
			WuHou: {
				'Linjiang Road': '临江路',
				'First Section of West NO.1 Circling Road': '一环路西一段',
				'Wuhou Avenue': '武侯大道',
				'Kehua Road': '科华路',
				'Forth Section of South NO.1 Circling Road': '一环路南四段',
				'Third Section of South NO.1 Circling Road': '一环路南三段',
			 	'Jinyang Road': '晋阳路',
				// 'Longteng Road': '',
				'New South Road':'新南路'
			},
			JinJiang: {
				'Middle Binjiang Road': '滨江中路',
				'Dacisi Road':'大慈寺路'
			}
	};

	var wordMapChinese = {
			QingYang: {
				'顺城大街': 'Shun Cheng Street',
				'清江东路': 'Qingjiang East Road',
				'金河路': 'Jinhe Road',
				'人民西路': 'Renmin West Road',
				'一环路西一段': 'First Section of West NO.1 Circling Road',
				'锦里东路': 'East Jinli Road',
				'锦里西路': 'West Jinli Road',
				'锦里中路': 'Middle Jinli Road'
			},
			JinNiu: {
				 '北站西二路': 'North Station West Second Road',
				 '九里堤北路': 'Jiulidi Road North',
				 '解放路一段': 'Jiefang Road(section 1)'
				// 'Simaqiao Street':''
			},
			WuHou: {
				'临江路': 'Linjiang Road',
				'一环路西一段': 'First Section of West NO.1 Circling Road',
				'武侯大道': 'Wuhou Avenue',
				'科华路': 'Kehua Road',
				'一环路南四段': 'Forth Section of South NO.1 Circling Road',
				'一环路南三段': 'Third Section of South NO.1 Circling Road',
			 	'晋阳路': 'Jinyang Road',
				// 'Longteng Road': '',
				'新南路': 'New South Road'
			},
			JinJiang: {
				'滨江中路': 'Middle Binjiang Road',
				'大慈寺路': 'Dacisi Road'
			}
	};

	util.centroidsColor = [
							  'rgba(120, 165, 117, 1)', 
							  'rgba(229, 129, 173, 1)', 
		                      // 'rgba(230, 132, 129, 1)', 
		                      'rgba(254, 162, 122, 1)', 
		                      'rgba(141, 111, 170, 1)', 
		                      'rgba(117, 140, 182, 1)', 

		                      'rgba(253, 227, 127, 1)', 
		                      'rgba(136, 198, 204, 1)', 
		                      'rgba(254, 162, 122, 1)', 
		                      'rgba(209, 129, 173, 1)', 
		                      'rgba(108, 109, 110, 1)', 
		                      'rgba(199, 214, 137, 1)'
	];   

	util.speedColorTable = [
	    'rgba(230, 0, 18, 1)',
	    'rgba(235, 97, 0, 1)',
	    'rgba(252, 200, 0, 1)',
	    'rgba(255, 251, 0, 1)',
	    'rgba(207, 219, 0, 1)',
	    'rgba(143, 195, 31, 1)',
	    'rgba(34, 172, 56, 1)',
	    'rgba(0, 153, 68, 1)',
	    'rgba(0, 155, 107, 1)',
	    'rgba(0, 158, 150, 1)',
	  ]; 

	util.moveLayerBefre = function (old_idx, new_idx){
	    if((old_idx === -1) || (new_idx === -1)){
	        return false;
	    }

	    layer = util.map.getLayers().removeAt(old_idx);
	    util.map.getLayers().insertAt(new_idx, layer);
	};

	util.findLayer = function (layer_name){
	    var layer_idx = -1;
	    $.each(util.map.getLayers().getArray(), function (k,v){
	        var this_layer_name = v.get('name');
	        if(this_layer_name == layer_name){
	            layer_idx = k;
	        }
	    });
	    return layer_idx;
	};

	util.districtToNumber = function(name) {
		switch(name) {
		  case "jinNiu": return 0;
          case "jinJiang": return 1;
          case "qingYang": return 2;
          case "wuHou": return 3;
          case "chengHua": return 4;
		  case 'others': return 5;
		}
		return -1;
	};

	util.number2Name = function(number) {
	    switch(number) {
	      case 0 : return "jinNiu";
	      case 1 : return "jinJiang";
	      case 2 : return "qingYang";
	      case 3 : return "wuHou";
	      case 4 : return "chengHua";
	    }
	  }

	var ColorBar = function() {
		var height = 16;
		var bar = document.createElement('div');
		bar.className = 'rotate-north ol-unselectable ol-control btn btn-default btn-sm ';
		bar.top = 20;

		for(var i = 0; i < util.speedColorTable.length; i ++) {
			var element = document.createElement('div');
			element.className = 'rotate-north ol-unselectable ol-control btn btn-default btn-sm ';
			element.top = i * height + 15;
			bar.appendChild(element);
        }
        return bar;
	};

	var ExtendedController = function(opt_options) {
        var options = opt_options || {};
        var element = document.createElement('div');
        var height = 32;
        var margin = 0;
        var map = document.getElementById('map');

        if(opt_options.name == 'barchart') {
        	height = 200;
        	margin = 20;
        	var width = 240;

        	element.style.left = 10;
        	element.style.top = map.offsetHeight - height - margin;
        	element.className = 'ol-unselectable ol-control';
        	element.style.height = height;
        	element.style.width = width;
        	element.setAttribute('id', 'barchart');

        	ol.control.Control.call(this, {
	          element: element,
	          target: options.target
	        });
        	return this;
        }

        if(opt_options.name == 'colorBar') {
        	var indexOld = opt_options.colorBar;
	        var index = util.speedColorTable.length - opt_options.colorBar - 1;
	        element.className = 'rotate-north ol-unselectable ol-control button-square button-tiny colorBar ';
	        element.style.backgroundColor = util.speedColorTable[indexOld];
	        element.style.top = index * 24 + 15 + margin;
	        element.style.left = map.offsetWidth - 30;
        	ol.control.Control.call(this, {
	          element: element,
	          target: options.target
	        });
	        return this;
        }

        if(opt_options.name == 'colorBarText') {
        	var span = document.createElement('div');
        	var indexOld = Math.ceil((opt_options.colorBar + 1) * 1.5 * 3.6);
	        var index = util.speedColorTable.length - opt_options.colorBar - 1;
	        span.style.backgroundColor = 'rgba(255, 255, 255, 0)';
        	span.className = 'ol-control colorBarText';
	        span.style.top = index * 24 + 17 + margin;
	        span.style.width = 75;
	        // if(indexOld % 4 == 0) {
	        	span.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
	        	span.innerHTML = indexOld == (15 * 3.6) ? '≥ ' + indexOld + ' km/h' : '≤ ' + indexOld + ' km/h';
	        // }
	        span.style.left = map.offsetWidth - 105;
        	ol.control.Control.call(this, {
	          element: span,
	          target: options.target
	        });
	        return this;
        }

        element.className = 'rotate-north ol-unselectable ol-control btn btn-default btn-sm ';
        element.style.backgroundColor = "#123456";
        var index = util.districtToNumber(opt_options.name);
        element.style.backgroundColor = util.centroidsColor[index];
        element.style.top = index * 32 + 15 + margin;

        if(index == -1) {
        	margin = 10;
        	element.className = 'ol-unselectable ol-control button button-pill button-small chooseDay ' + opt_options.name;
        	element.style.backgroundColor = "#123456";
        	element.style.top = 15;
        }

        element.innerHTML = '<span>' + opt_options.name + '</span>';
        element.style.color = 'rgba(255, 255, 255, 1)';
        ol.control.Control.call(this, {
          element: element,
          target: options.target
        });
        return this;
    };

    var day2Number = function(day) {
    	switch(day) {
    		case 'weekdays': return 5;
    		case 'all': return 6;
    		case 'weekend': return 7;
    	}
    };

	util.setMap = function (map) {
		ol.inherits(ExtendedController, ol.control.Control);
		var extend = [
          // new ExtendedController({name: 'jinNiu'}),
          // new ExtendedController({name: 'jinJiang'}),
          // new ExtendedController({name: 'wuHou'}),
          // new ExtendedController({name: 'chengHua'}),
          // new ExtendedController({name: 'qingYang'}),
          new ExtendedController({name: 'weekends', day: true}),
          new ExtendedController({name: 'all', day: true}),
          new ExtendedController({name: 'weekdays', day: true}),
          // new ExtendedController({name: 'barchart'})
        ];

        for(var i = 0; i < 10; i ++) {
        	extend.push(new ExtendedController({name: 'colorBar', colorBar: i}));
        	extend.push(new ExtendedController({name: 'colorBarText', colorBar: (i)}));
        }



		map.controls = ol.control.defaults({
          attributionOptions: ({
            collapsible: false
          })
        }).extend(extend);

		util.map = new ol.Map(map);
	};

	var getLayersLength = function() {
		return util.map.getLayers().getArray().length;
	};

	util.English2Chinese = function(English) {
		for(var district in wordMapEnglish) {
			if(wordMapEnglish[district][English]) return wordMapEnglish[district][English];
		}
		return null;
	}

	util.Chinese2English = function(Chinese) {
		for(var district in wordMapChinese) {
			if(wordMapChinese[district][Chinese]) return wordMapChinese[district][Chinese];
		}
		return null;
	}

	util.clear = function() {
		var len = getLayersLength();
		var layers = util.map.getLayers();
    	d3.select(".below_chord ").selectAll('svg').remove();
		for(var i = count; i < len; i ++) {
			util.removeTopLayer();
		}
		util.layerArr = [];
	};
	
	util.removeTopLayer = function (){
	  var layers = util.map.getLayers();
	  layers.pop();
	};

	util.draw = function () {
		for(var i = util.layerArr.length - 1; i >= 0 ; i --) {
			util.map.addLayer(util.layerArr[i]);
		}
	};

	util.clearLine = function(str){
	  for (var i = 0; i < carDate.length; i ++){
	    if (carDate[i] == str){
	      dynamicArr[i] = 0;
	      break;
	    }
	  }
	  if(str == 'all') i = carDate.length;
	  util.map.getLayers().remove(util.layerArr[i])
	  console.log("delete One");
	};

	util.drawRoadNetwork = function(geoObj) {
		var features = (new ol.format.GeoJSON()).readFeatures(geoObj.geojsonObject, geoObj.option);
		vectorSource = new ol.source.Vector({
			features: features
		});
		var layer = new ol.layer.Vector({
			source: vectorSource,
			style: geoObj.styleFunction
		});
		util.map.addLayer(layer);
	};

	util.drawLines = function(str){
	  for (var i=0;i<carDate.length;i++){
	    if (carDate[i] == str){
	      dynamicArr[i] =1;
	      break;
	    }
	  }
	  if(str == 'all') i = carDate.length;
	  util.map.addLayer(util.layerArr[i]);
	};

	util.drawOneLayer = function(geoObj) {
		count ++;
		if(geoObj.option == undefined) {
		  vectorSource = new ol.source.Vector({
		    features: (new ol.format.GeoJSON()).readFeatures(geoObj.geojsonObject)
		  });
		} else {
		  vectorSource = new ol.source.Vector({
		    features: (new ol.format.GeoJSON()).readFeatures(geoObj.geojsonObject, geoObj.option)
		  });
		}
		var layer = new ol.layer.Vector({
		    source: vectorSource,
		    style: geoObj.styleFunction
		 });
		util.map.addLayer(layer);
	};

	util.replaceRoadNet = function(geoObj) {
		var vectorSource = null;
		vectorSource = new ol.source.Vector({
		    features: (new ol.format.GeoJSON()).readFeatures(geoObj.geojsonObject, {'dataProjection':'EPSG:4326','featureProjection':'EPSG:3857'})
		});
		var layer = new ol.layer.Vector({
		    source: vectorSource,
		    style: geoObj.styleFunction
		 });
		util.map.addLayer(layer);
	}

	util.addVectorLayer = function(geoObj) {
		var vectorSource = null;
		if(geoObj.isFeature) {
			vectorSource = new ol.source.Vector({
			    features: geoObj.geojsonObject
			});
			var layer = new ol.layer.Vector({
			    source: vectorSource,
			    style: geoObj.styleFunction
			 })
		} else {
			if(geoObj.option == undefined) {
			  vectorSource = new ol.source.Vector({
			    features: (new ol.format.GeoJSON()).readFeatures(geoObj.geojsonObject)
			  });
			} else {
			  vectorSource = new ol.source.Vector({
			    features: (new ol.format.GeoJSON()).readFeatures(geoObj.geojsonObject, geoObj.option)
			  });
			}
			var layer = new ol.layer.Vector({
			    source: vectorSource,
			    style: geoObj.styleFunction
			 });
			layer.set('name', geoObj.name);

		}
		util.layerArr.push(layer);
	};

	return util;
};
