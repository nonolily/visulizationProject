var districtAnalysis = function(util) {
	var featureCentroid = []
		, colors = [  'rgba(87, 156, 58, 0.1)', 
		              'rgba(253, 153, 25, 0.1)', 
		              'rgba(114, 14, 255, 0.1)', 
		              'rgba(58, 140, 255, 0.1)', 
		              'rgba(254, 64, 129, 0.1)', 
		              'rgba(0, 87, 179, 0.1)', 
		              'rgba(171,217,233, 0.1)', 
		              'rgba(116,173,209, 0.1)', 
		              'rgba(69,117,180, 0.1)', 
		              'rgba(49,54,149, 0.1)' ]
		, data = null, kmeansData = null
		, oldLabel = null
		, MINHEIGHT = 10, MAXHEIGHT = 40
		, MINRADIUS = 30, MAXRADIUS = 60
		, MAXINTERVAL = Number.MIN_VALUE, MININTERVAL = Number.MAX_VALUE
		, districtsNames = ["jinNiu", "jinJiang", "qingYang", "wuHou", "chengHua"]
		, centroids = {jinNiu: [104.044679, 30.710135], jinJiang: [104.103809, 30.608223],
					   chengHua: [104.132294, 30.68122], qingYang: [103.99973, 30.670786],
					   wuHou: [104.028834, 30.612825]};
	
	var drawCentorids = function() {
		var query = {};
		$.get('/query/districtData', query, function (response) {
		  util.clear();
		  var index = 0;
		  featureCentroid = [];
		  var clusters = response;
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

		  for(var i in clusters) {
		    var centroids = clusters[i];
		    var name = clusters[i].name;
		    var label = clusters[i].label;
		    for(var j = 0; j < centroids.length; j ++) {
		    	tmpX = centroids[j][0];
			    tmpY = centroids[j][1];
			    geojsonObject.features.push(turf.point([tmpX - 0.0025, tmpY + 0.0025], {'index': j}));
		    }
		    
		  } // end of for - i

		    util.addVectorLayer({geojsonObject: geojsonObject, styleFunction: styleFunctionForCentroid,
		    					 option: {'dataProjection':'EPSG:4326','featureProjection':'EPSG:3857'},
								 name: 'centroids'});
		    util.draw();
		  $("#sidebar_loader")[0].style.display="none";
		});
	};

	var drawClusteredPoints = function (query) {
		data = null;
		if(query.label == 'all') {
			$.get('/query/processAllData', query, function (response) {
			  	drawPoint(response, 'all');
			});
		} else {
			$.get('/query/processedData', query, function (response) {
			  	drawPoint(response, 'all');
			});
		}
	};

	var drawPoint = function(response, type) {
		if(!data) {
			data = response;
			MAXINTERVAL = Number.MIN_VALUE, MININTERVAL = Number.MAX_VALUE;
		}
		  util.clear();
		  var index, j, i
		  	  , featureCentroid = []
		  	  , clusters = data.clusters
		  	  , weekdays = data.flowInformation['weekdays'], weekdaysBar
		  	  , weekend = data.flowInformation['weekend'], weekendBar
		  	  , flowMatrix = [], bars = [], intervals = []
		  	  , allBar = {}, label, temp = [], whichDay = -1
		  	  , min = Number.MAX_VALUE, max = Number.MIN_VALUE
		  	  , minH = Number.MAX_VALUE, maxH = Number.MIN_VALUE;

		  for(i in clusters) {
		  	temp = [];
		  	temp[0] = parseInt(((clusters[i].intervals.weekdays + clusters[i].intervals.weekend)) / 1000 / 7);
		  	temp[1] = parseInt(clusters[i].intervals.weekdays / 1000 / 5 );
		  	temp[2] = parseInt(clusters[i].intervals.weekend / 1000 / 2 );
		  	MAXINTERVAL = MAXINTERVAL < d3.max(temp) ? d3.max(temp) : MAXINTERVAL;
		  }

		  MAXINTERVAL = MAXINTERVAL / (60 * 60 * 24);

		  if(type == 'all') {
		  	
		  	for(i in clusters) {
		  		intervals[districtToNumber(i)] = parseInt(((clusters[i].intervals.weekdays + clusters[i].intervals.weekend)) / 1000 / 7);
		  	}
			for(i = 0; i < weekdays.length; i ++) {
			  flowMatrix[i] = [];
			  flowMatrix[i][i] = 0;
			  for(j = 0; j < weekdays[0].length; j ++) {
				  flowMatrix[i][j] = weekdays[i][j] + weekend[i][j];
			  }
			}
		  } else if(type == 'weekdays') {
		  	flowMatrix = weekdays;
		  	for(i in clusters) {
		  		intervals[districtToNumber(i)] = parseInt(clusters[i].intervals.weekdays / 1000 / 5);
		  	}
		  } else if(type == 'weekend') {
		  	flowMatrix = weekend;
		  	for(i in clusters) {
		  		intervals[districtToNumber(i)] = parseInt(clusters[i].intervals.weekend / 1000 / 5);
		  	}
		  }
		  

		  for(index in data.clusters) {
		  	label = data.clusters[index].label;
		  	var bars = [];
		  	  
		  	  weekendBar = data.clusters[index].barInfomation.weekend;
		  	  weekdaysBar = data.clusters[index].barInfomation.weekdays;

		  	  if(type == 'all') {
		  	  	for(i = 0; i < 24; i ++) {
		  	  		if(weekendBar[i] && weekdaysBar[i]) bars[i] = Number(weekendBar[i]) + Number(weekdaysBar[i]);
		  	  		else if(!weekendBar[i] && weekdaysBar[i]) bars[i] = Number(weekdaysBar[i]);
		  	  		else if(weekendBar[i] && !weekdaysBar[i]) bars[i] = Number(weekendBar[i]);
				  } // end of for - allBar
				} else if(type == 'weekdays') {
					for(i = 0; i < 24; i ++) {
						if(weekdaysBar[i]) bars[i] = weekdaysBar[i];
					}
				} else {
					for(i = 0; i < 24; i ++) {
						if(weekendBar[i]) bars[i] = weekendBar[i];
					}
				}
				allBar[index] = bars;

		  	  max = data.clusters[index].size > max ? data.clusters[index].size : max;
		  	  min = data.clusters[index].size < min ? data.clusters[index].size : min;

		  	  var sizeTemp = 0;

		  } // end of for - index in data.clusters


		  drawBarChart(intervals, label);
		  regionChord(flowMatrix);	
		  // drawPieChart(intervals);  

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

		  for(i in clusters) {
		  	var hourlyData = allBar[i];
		  	for(index in hourlyData) {
		    	try{
		    		maxH = hourlyData[index] > maxH ? hourlyData[index] : maxH;
		  			minH = hourlyData[index] < minH ? hourlyData[index] : minH;
		    	}catch(e) {
		    		console.log(index);
		    	}
		    }
		  }

		  for(i in clusters) {
		    var element = clusters[i].points
		    	, count = clusters[i].size
		        , centroid = clusters[i].centroid
		        , name = clusters[i].name
		        , label = clusters[i].label
		        , hourlyData = allBar[i];

		    // if(label == 'all') centroid = centroids[i];

		    setCentroid(centroid, count, hourlyData, i, max, min, maxH, minH);
		    setFlowInformation(centroid, flowMatrix, count, i, max, min);
		  } // end of for - i

		    util.draw();
		  $("#sidebar_loader")[0].style.display="none";
	};

	var drawBarChart = function(intervals, label) {

		d3.select(".pieChart").selectAll('svg').remove();
		var width = $('.pieChart').get(0).offsetWidth
			, height = $('.pieChart').get(0).offsetHeight
	        , margin = 20, marginRect = 30, marginLeft = 50, marginBottom = 20, marginTop = 10
	        , rectWidth = 35
	        // , districtsNames = ["00", "01", "02", "03", "04", " "]
	        , districtsNames = ["JN", "JJ", "QY", "WH", "CH", " "]
	        , i
	        ;

        for(i = 0; i < intervals.length; i ++) {
        	intervals[i] /= (60 * 60 * 24);
        }
        

		var svg = d3.select('.pieChart')
		    .append('svg')
		    .attr({
		      'height': height,
		      'width': width
		    })
		    .style({
		      'background-color': 'rgba(0, 0, 0, 0)'
		    });
		    
		var x = d3.scale.ordinal()
		        .domain(districtsNames)
		        .range([marginLeft, 
		                marginLeft + marginRect, 
		                marginLeft + marginRect * 2, 
		                marginLeft + marginRect * 3, 
		                marginLeft + marginRect * 4, 
		                marginLeft + marginRect * 5]);

		var y = d3.scale.linear()
				.domain([MAXINTERVAL, 0])
		        .range([marginTop, height - marginBottom]);

		var xAxis = d3.svg.axis()
		          .scale(x)
		          .orient("bottom")
		          ;

		var yAxis = d3.svg.axis()
		            .scale(y)
		            .orient("left")
		            .tickFormat(function(d) {
		            	var dn = getDigit(d)
		            	var digit = dn[0];
		            	var name = dn[1];
						return (d / Math.pow(10, digit)) + name;
		            });

		var rects = svg.selectAll('rect')
		            .data(intervals)
		            .enter()
		            .append('rect')
		            .attr({
		              'x': function(d, i) {
		                      return x(util.number2Name(i)); 
		                   },
		              'y': function(d) { 
		                      return y(d);
		                    },
		              'width': '10px',
		              'height': function(d) { 
		                          var h = height - y(d) - marginBottom;
		                          return h;  
		                        },
		              'fill': function(d, i) {
		                        return util.centroidsColor[i];
		                      }
		            });

		svg.append("g")
		  .attr("class", "x axis")
		  .attr("transform", "translate(0," + (height - marginBottom) + ")")
		  .call(xAxis);

		svg.append("g")
		 .attr('class', 'y axis')
		 .attr("transform", "translate(" +  marginLeft + ", 0)")
		 .call(yAxis);
	};

	this.init = function() {
		data = null;
		$('#submit').click(submitEvent);
		$('.weekdays').click(checkWeekdays);
		$('.weekends').click(checkWeekend);
		$('.all').click(checkAll);
		$('#kmeans').click(toggleEvent);
		drawDistricts();
		// drawBasePoints();
	};

	var drawBasePoints = function() {
		$.get('/query/getBasePoint', function(res) {
			// var geoObj = [];
			for(var i in res) {
				res[i].geometry.coordinates[0].forEach(function(i) {
					i[0] -= 0.0025;
					i[1] += 0.0025;
				});	
				res[i].properties = {index: i};
				// geoObj.push(res[i]);
			}

			res = turf.featureCollection(res);
			var map = { geojsonObject: res,
						styleFunction: styleFunctionForKMeans,
						option: {'dataProjection':'EPSG:4326','featureProjection':'EPSG:3857'},
						name: 'districts'};
			util.drawOneLayer(map);
		});
	};

	var submitEvent = function (event) {
	    refresh($(this).prev().val());
	};

	var checkWeekdays = function() {
		if(data) {
			drawPoint(data, 'weekdays');
			$(this).css('background-color', '#000');
			$('.weekend').css('background-color', '#123456');
			$('.all').css('background-color', '#123456');
		}
	};

	var checkWeekend = function() {
		if(data) {
			drawPoint(data, 'weekend');
			$(this).css('background-color', '#000');
			$('.weekdays').css('background-color', '#123456');
			$('.all').css('background-color', '#123456');
		}
	};

	var checkAll = function() {
		if(data) {
			drawPoint(data, 'all');
			$(this).css('background-color', '#000');
			$('.weekend').css('background-color', '#123456');
			$('.weekdays').css('background-color', '#123456');
		}
	};

	var refresh = function (value){
	    $("#sidebar_loader")[0].style.display="";
	    $("#car_date")[0].innerHTML = "";
	    var query = {};
	    query.label = value; 

	    $('.colorBar').hide()
	    $('.colorBarText').hide();
	    $('.chooseDay').show();

		$('.all').css('background-color', '#000');
		$('.weekend').css('background-color', '#123456');
		$('.weekdays').css('background-color', '#123456');
		$('#barchart').show();
		data = null;
		kmeansData = null;

	    drawClusteredPoints(query);
	};

	var toggleEvent = function() {
		var databaseName
			, query
			, value = $(this).children().html()
			, label = $('#submit').prev().val()
			, databaseName = 'districtData'
			, that = this
			;

		query = {label: 'all'};
		$('.colorBar').hide()
	    $('.colorBarText').hide();
	    $('.chooseDay').show();

		$('.all').css('background-color', '#000');
		$('.weekend').css('background-color', '#123456');
		$('.weekdays').css('background-color', '#123456');
		$('#barchart').show();

		$.get('/query/KMeansData', query, function(res) {
			data = res;
			drawPoint(data, 'all');
		});
	};
	
	var styleFunctionForCentroid = function(feature, resolution) {
	  var type = feature.getGeometry().getType();
	  var index = feature.getProperties()['index'];
	  var radius = feature.getProperties()['radius'];
	  var centroid = feature.getProperties()['centroid'];
	  var width = feature.getProperties()['width'];
	  var height = feature.getProperties()['height'];
	  var position = feature.getProperties()['position'];
	  var radius = feature.getProperties()['radius'];
	  var colorString;

	  if('LineString' === type) {
	    return [new ol.style.Style({
	    stroke: new ol.style.Stroke({
	      color: util.centroidsColor[index],
	      width: width
	    }),
	    fill:new ol.style.Fill({
	          color: 'rgba(0, 0, 0, 1)',
	    })
	    })];
	  }

	  if(centroid) {
	  	index = districtToNumber(feature.getProperties()['index']);
	    return [new ol.style.Style({
	          image: new ol.style.Circle({
	            stroke: new ol.style.Stroke({
	              color: util.centroidsColor[index],
	              width: 2
	            }),
	            radius: radius,
	            fill: new ol.style.Fill({
	              color: 'rgba(255, 255, 255, 0.00000000000001)',
	            })
	          })
	        })];
	  }

	  if('Polygon' === feature.getGeometry().getType()) {
	    colorString = util.centroidsColor[index];

	    if(position) {
	    	if(position % 3 == 0) {
	  			var style = [new ol.style.Style({
						      stroke: new ol.style.Stroke({
						        color: 'rgba(255, 255, 255, 1)',
						        width: 0.1
						      }),
						      fill: new ol.style.Fill({
						        color: colorString // util.centroidsColor[index]
						      }),
						      text: new ol.style.Text({
						          font: '12px Calibri,sans-serif',
						          fill: new ol.style.Fill({
						            color: '#fff'
						          }),
						          stroke: new ol.style.Stroke({
						            color: '#fff',
						            width: 1
						          }),
						          text: position
						        })
						    })];

	    	} else {
	    		var style = [new ol.style.Style({
						      stroke: new ol.style.Stroke({
						        color: 'rgba(255, 255, 255, 1)',
						        width: 0.1
						      }),
						      fill: new ol.style.Fill({
						        color: colorString // util.centroidsColor[index]
						      })
						    })];
	    	}
	  	} else {
	  		var style = [new ol.style.Style({
					      stroke: new ol.style.Stroke({
					        color: 'rgba(255, 255, 255, 1)',
					        width: 0.1
					      }),
					      fill: new ol.style.Fill({
					        color: colorString // util.centroidsColor[index]
					      })
					    })];
	  	}
	    return  style;
	  }

	  if(radius) {
	  	width = 5;
	  }
	  else {
	  	width = 10;
	  	radius = 2;
	  }

	  return [new ol.style.Style({
	          image: new ol.style.Circle({
	            stroke: new ol.style.Stroke({
	              color: util.centroidsColor[index],
	              width: width
	            }),
	            radius: radius,
	            fill: new ol.style.Fill({
	              color: 'rgba(255, 255, 255, 0.1)',
	            })
	          })
	        })];
	};  

	var styleFunctionForFlowInformation = function(features, resolution) {
	  var index = features.getProperties()['index'];
	  return [new ol.style.Style({
	      stroke: new ol.style.Stroke({
	        color: 'black',
	        width: 0.0000000000005
	      }),
	      fill: new ol.style.Fill({
	        color: util.centroidsColor[index]
	      })
	    })];
	};

	var styleFunctionForDistricts = function(feature, resolution) {
		var index = feature.getProperties()['index'];
		var s = util.centroidsColor[index].split(')')[0] ;
		s = s.substring(0, s.length - 2);
		var colorString = s + '0.1)';
		return [new ol.style.Style({
		  stroke: new ol.style.Stroke({
		    color:util.centroidsColor[index], //'white', 
		    width: 1
		  }),
		  fill:new ol.style.Fill({
		        color: colorString // 'rgba(0, 0, 0, 0)',
		  })
		})];
	};

	var styleFunctionForKMeans = function(feature, resolution) {
		var index = 7; // feature.getProperties()['index'];
		return [new ol.style.Style({
		  stroke: new ol.style.Stroke({
		    color: 'rgba(199, 214, 137, 1)',   // 'rgba(136, 198, 204, 1)',  // util.centroidsColor[index], //'white', 
		    width: 5
		  }),
		  fill:new ol.style.Fill({
		        color: 'rgba(0, 0, 0, 0)',  // colorString // 'rgba(0, 0, 0, 0)',
		  })
		})];
	};

	var drawDistricts = function() {
		$.get('/query/getDistrictsData', function(response){
			var geoObj = [];
			for(var i in response) {
				response[i].geometry.coordinates[0].forEach(function(i) {
					i[0] -= 0.0025;
					i[1] += 0.0025;
				});	
				// response[i].properties = {index: i};
				response[i].properties = {index: districtToNumber(i)};
				geoObj.push(response[i]);
			}

			geoObj = turf.featureCollection(geoObj);
			var map = { geojsonObject: geoObj,
						styleFunction: styleFunctionForDistricts,
						option: {'dataProjection':'EPSG:4326','featureProjection':'EPSG:3857'},
						name: 'districts'};
			util.drawOneLayer(map);

		});
	};	

	var districtToNumber = function(name) {
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

	var setCentroid = function (centroid, count, hourlyData, i, max, min, maxH, minH) {
	    featureCentroid[i] = centroid;
	    resolution = util.map.getView().getResolution();

	    var geojsonObject = {
		      'type': 'FeatureCollection',
		      'features': []
		    }
	    	, height
	    	, index
	    	, radius = getRadius(count, max, min)
	    	, temp = ol.proj.transform([centroid[0], centroid[1]], 'EPSG:4326','EPSG:3857');

	    geojsonObject.features.push(turf.point(temp, { 'index': i,
	                                                   'centroid': true,
	                                                   'radius': radius,
	                                                   'radiusInMap': radius * resolution }));

	    var width = 2 * Math.PI * radius / 40;

	    for(index in hourlyData) {
	    	try{
	    		var petals = getRosePetals(centroid, hourlyData[index], i, Number(index), radius, maxH, minH);
	        	geojsonObject.features.push(petals);
	    	}catch(e) {
	    		console.log(index);
	    	}
	    }

	   util.addVectorLayer({geojsonObject: geojsonObject, styleFunction: styleFunctionForCentroid, name: i});
	   return geojsonObject;
	};

	var setFlowInformation = function(centroid, flowMatrix, count, i, max, min) {
		featureCentroid[i] = centroid;
		resolution = util.map.getView().getResolution();
		var geojsonObject = {
		  'type': 'FeatureCollection',
		  'features': []
		};
		var radius = getRadius(count, max, min);
		var temp = ol.proj.transform([centroid[0], centroid[1]], 'EPSG:4326','EPSG:3857');
		var froms = flowMatrix[districtToNumber(i)];
		var polygons = getFlowInformationSegement(centroid, froms, count, i, max, min);
		var features = turf.featureCollection(polygons);
	    util.addVectorLayer({geojsonObject: features, styleFunction: styleFunctionForFlowInformation, name: i});
	    return features;
	};

	var getFlowInformationSegement = function(centroid, froms, count, name, max, min) {
		var geojsonObject = [];
		var sumFroms = Sum(froms);
		var startAngle, endAngle, deltaAngle;
		var cacheFrom = 0;
		var cacheTo = 0;
		var N = 50;
		var coordinates = [], top, bottom;
		var radius = getRadius(count, max, min);
		var width = radius / 5;
		var innerArch = radius / 2;
		var outerArch = innerArch * 2;
		centroid = ol.proj.transform([centroid[0], centroid[1]], 'EPSG:4326','EPSG:3857');

		for(var i = 0; i < 5; i ++) {
		  if(froms[i]) {
		    coordinates = drawArch(froms[i], sumFroms, cacheFrom, N, innerArch, width, centroid);

		    var innerPolygon = turf.polygon([coordinates], {index: i});
		    geojsonObject.push(innerPolygon);
		    cacheFrom += froms[i];
		  }
		}

		return geojsonObject;
	};

	var drawArch = function(data, sum, chache, N, arch, width, centroid) {
		resolution = util.map.getView().getResolution();
		var coordinates = [];
		var startAngle = 2 * Math.PI * chache / sum;
		var endAngle = 2 * Math.PI * (chache + data) / sum;
		var deltaAngle = (endAngle - startAngle) / N;
		var top, bottom;

		for(var i = 0; i < N; i ++) {
		  top = [centroid[0] + resolution * arch * Math.sin(startAngle + deltaAngle * i),
		         centroid[1] - resolution * arch * Math.cos(startAngle + deltaAngle * i)];

		  bottom = [ centroid[0] + resolution * (arch + width) * Math.sin(startAngle + deltaAngle * i),
		             centroid[1] - resolution * (arch + width) * Math.cos(startAngle + deltaAngle * i)];
		  coordinates[i] = top;
		  coordinates[2 * N - 1 -i] = bottom;                               
		} 
		coordinates[2 * N] = [centroid[0] + resolution * arch * Math.sin(startAngle),
		                      centroid[1] - resolution * arch * Math.cos(startAngle)];
		
		return coordinates;
	};

	var Sum = function(elements) {
		var sum = 0;
		for(var i = 0; i < elements.length; i ++) {
		  if(elements[i]) {
		    sum += elements[i];
		  }
		}
		return sum;
	};

	var drawPieChart = function(intervals) {
		d3.select(".pieChart ").selectAll('svg').remove();
		var width = $('.pieChart').get(0).offsetWidth
			, height = $('.pieChart').get(0).offsetHeight
		    , radius = Math.min(width, height) / 2;

		var arc = d3.svg.arc()
		    .outerRadius(radius - 10)
		    .innerRadius(0);

		var labelArc = d3.svg.arc()
		    .outerRadius(radius - 40)
		    .innerRadius(radius - 40);

		var pie = d3.layout.pie()
		    .sort(null)
		    .value(function(d) { return d; });

		var svg = d3.select(".pieChart").append("svg")
		    .attr("width", width)
		    .attr("height", height)
		  .append("g")
		    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

		var g = svg.selectAll(".arc")
		    .data(pie(intervals))
		  .enter().append("g")
		    .attr("class", "arc");

		g.append("path")
	     .attr("d", arc)
	     .style("fill", function(d, i) { return util.centroidsColor[i]; })
	     .style('stroke', 'black')
	     .style('stroke-width', '1');
	}

	var getHeight = function(data, max, min) {
		var height = 0;
		try{
			height = (MAXHEIGHT - MINHEIGHT) * (data - min) / (max - min);
			height = height == 0 ? MINHEIGHT : height;
		}catch(e){
			height = MINHEIGHT;
		}
		return height;
	};

	var getRosePetals = function(centroid, data, index, position, radius, maxH, minH) {
		index = districtToNumber(index);
		var margin = Math.PI * 3 / 180
			, delta = (2 * Math.PI) / 24
			, N = 50
			, startAngle = Math.PI - position * delta
			, endAngle = Math.PI - (position + 1) * delta + margin
			, deltaAngle = (endAngle - startAngle) / N
			, curve = []
			, temp = ol.proj.transform([centroid[0], centroid[1]], 'EPSG:4326','EPSG:3857')
			, height = getHeight(data, maxH, minH);

		for(var i = 0; i < N; i ++) {
		  var top = [ temp[0] + resolution * radius * Math.sin(startAngle + deltaAngle * i), 
		              temp[1] - resolution * radius * Math.cos(startAngle + deltaAngle * i) ];

		  var bottom = [ temp[0] + resolution * (radius + height) * Math.sin(startAngle + deltaAngle * i), 
		                 temp[1] - resolution * (radius + height) * Math.cos(startAngle + deltaAngle * i) ];
		  curve[i] = top;
		  curve[2 * N - 1 - i] = bottom;
		}  
		curve.push([temp[0] + resolution * radius * Math.sin(startAngle), 
		            temp[1] - resolution * radius * Math.cos(startAngle)]);


		var petals = turf.polygon([curve]);

		petals.properties = {'index': index,
		                    'position': position,
		                    'height': height,
		                    'radius': radius,
		                    'N':  N};
		return petals;                        
	};

	var getRadius = function (count, max, min) {
		try{
			var radius = (MAXRADIUS - MINRADIUS) * (count - min) / (max - min) + MINRADIUS;
			radius = count == min ? MINRADIUS : (count == max ? MAXRADIUS : radius) ;
		} catch(e) {
			var radius = MINRADIUS;
		}
		return radius;
	};

	var getDigit = function (num) {
		var count = 0, digit
			, name;
		while(num > 10) {
			count ++;
			num = num / 10;
		}
		if(count < 3) {
			name = 'd'; digit = 1; return [digit, name];
		} else if(count < 6) {
			name = 'kd'; digit = 3; return [digit, name];
		} else if(count < 9) {
			name = 'md'; digit = 6; return [digit, name];
		} else if(count < 1) {
			name = 'bd'; digit = 6; return [digit, name];
		} else {
			name = 'xd'; digit = 15; return [digit, name];
		}
		
	};

	var prepareBarChart = function (coordinates) {
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

		for(var i = 0; i < 24; i ++) {
		  features.push({
		    'type': 'Feature',
		    'geometry': {
		      'type': 'LineString',
		      'coordinates': [[transPoint1[0], transPoint1[1]], [transPoint2[0], transPoint2[1]]]
		    },
		    'properties': { 'speed': speeds[d],
		                    'max': max}
		  })
		}
	};

	util.map.getView().on('change:resolution', function(e) {
	    if(featureCentroid) {
	      // 取得地图上的矢量层
	      var layers = util.map.getLayers().getArray();
	      for(var i = 0; i < layers.length; i ++) {
	        if('getFeatures' in layers[i].getSource()) {
	          var features = layers[i].getSource().getFeatures();
	          for(var j = 0; j < features.length; j ++) {
	            var feature = features[j];
	            var type = feature.getGeometry().getType();
	            var centroid = feature.getProperties()['centroid'];
	            if(centroid) {
	            	relocateBar(featureCentroid, feature);
	            }
	          }
	        }
	      }
	      util.map.render();
	    }
	});

	function relocateBar (centroids, feature) {
		resolution = util.map.getView().getResolution();
		var index = districtToNumber(feature.getProperties()['index']);
		var radius = feature.getProperties()['radiusInMap'] / resolution;
		var centroid = centroids[index];

		var newStyle = [new ol.style.Style({
          image: new ol.style.Circle({
            stroke: new ol.style.Stroke({
              color: util.centroidsColor[index],
              width: 2
            }),
            radius: radius,
            fill: new ol.style.Fill({
              color: 'rgba(255, 255, 255, 0.00000000000001)',
            })
          })
        })];

        feature.setStyle(newStyle)
	};

	return this;
};



