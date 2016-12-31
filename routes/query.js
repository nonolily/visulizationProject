var express = require('express')
	, mongodb = require('mongodb')
	, GeoJSON = require('geojson')
	, strftime = require('strftime')
	, fs = require('fs')
	, GeoJSON = require('geojson')
	, promise = require('bluebird')
	, http = require('http')
	, turf = require('turf')
	, concaveman = require('concaveman')
	, roadNet = require('../data/chengdu_china_osm_line.json')
	, router = express.Router()
	, MongoClient = mongodb.MongoClient;

var MAXLONGITUDE = 104.1621, MINLONGITUDE = 103.9465, MAXLATITUDE = 30.7312, MINLATITUDE = 30.5670
	, roadNames =  ["顺城大街", "九里堤北路","北站西二路", "清江东路", "金河路", "临江路", "人民西路",  
				    "一环路西一段", "武侯大道", "科华路", "锦里东路","解放路一段", "锦里西路", "滨江中路", 
				    "一环路西一段", "一环路南四段", "一环路南三段", "大慈寺路","晋阳路", "龙腾路", "新南路", 
				    "科华路", "驷马桥街", "锦里中路", "锦里东路"]
	, centroids = {jinNiu: [104.044679, 30.710135], jinJiang: [104.103809, 30.608223],
				   chengHua: [104.132294, 30.68122], qingYang: [103.99973, 30.670786],
				   wuHou: [104.028834, 30.612825]}				
	, url = 'mongodb://localhost/lab'
	;

// var url = 'mongodb://192.168.1.109:27017/lab';

function connectToDataBase(mapOptions, res) {
	var condition = mapOptions.condition;
	var collectionName = mapOptions.collectionName;
	if(mapOptions.options) {
		var options = mapOptions.options;
	} else {
		var options = {};
	}

	MongoClient.connect(url, function(err, db) {
		if(err) console.log('connection error');
		var collection = db.collection(collectionName);
		collection.find(condition, options).toArray(function(err, result) {
			if(err) {
				console.log(err);
				db.close();
				return ;
			}
			if(mapOptions.districts)
				result = mapOptions.callback(result, mapOptions.districts);
			else {
				result = mapOptions.callback(result);
			}

			if(mapOptions.find) {
				for(index in result) {
					collection.insert(result[index]);
				}
				console.log('all saved');
			}

			if(result) {
				res.send(result);
			} 
			db.close();
		});
	});
};

router.get('/insertKMeansData', function (req, res) {
	var data = [{size: 111234285, name: 0, label: 'all', centroid: [104.05787215207015, 30.631425802131375], intervals: [37112548217, 33152484678], flowInformation: [[84184437, 117360, 110769, 67522, 127138], [137175838, 195895, 180673, 108236, 200702]], counts: [[1713763, 1516408, 1181974, 906467, 728793, 714446, 789581, 1252222, 1922462, 2209026, 2271609, 2150335, 1948897, 1998490, 2214241, 2307378, 2172184, 2061782, 1995799, 1994435, 2098930, 2166172, 2053680, 1934539], [2396644, 2013054, 1589087, 1250925, 1044686, 1068226, 1235105, 2129467, 3324540, 3847771, 3965238, 3739423, 3213113, 3228317, 3651751, 3791197, 3602400, 3405701, 3244951, 3057440, 3336682, 3586278, 3628362, 3580314]]},
				{size: 88277087, name: 1, label: 'all', centroid: [104.08197798029491, 30.68708059362673], intervals: [29946308719, 26279099587], flowInformation: [[115804, 67753781, 106718, 97, 108902], [193841, 107928336, 171931, 489, 174269]], counts: [[1338277, 1195520, 1044673, 932000, 933677, 980216, 1126707, 1558368, 1775553, 1794437, 1806708, 1714111, 1525435, 1524245, 1561961, 1556475, 1557457, 1495641, 1336626, 1347051, 1489194, 1462604, 1496796, 1488920], [1948625, 1668994, 1513611, 1370656, 1385660, 1439256, 1648804, 2363503, 2736311, 2786845, 2881493, 2707693, 2380695, 2390320, 2539946, 2554313, 2555030, 2386237, 2165887, 2196944, 2463582, 2567080, 2746891, 2836059]]},
				{size: 78406383, name: 2, label: 'all', centroid: [104.01588851491137, 30.678242560651444], intervals: [26476071888, 23497616735], flowInformation: [[113247, 103926, 59887953, 23057, 199], [184124, 168009, 96292336, 39113, 802]], counts: [[1434403, 1259381, 1098032, 977190, 887152, 885860, 951699, 1133465, 1221810, 1241814, 1305499, 1365607, 1272973, 1228078, 1252288, 1251900, 1283394, 1367440, 1442398, 1433783, 1376074, 1438994, 1485658, 1469299], [1991379, 1775361, 1567684, 1405145, 1323448, 1319852, 1454044, 1747751, 1887483, 1978055, 1957888, 2003713, 1965141, 2004247, 2042531, 2094985, 2155628, 2314598, 2406410, 2416765, 2384559, 2616051, 2783672, 2745802]]},
				{size: 26807321, name: 3, label: 'all', centroid: [103.98579796661397, 30.595779120391207], intervals: [8970260246, 7819497124], flowInformation: [[67775, 96, 22752, 20390452, 129], [108844, 449, 38676, 32985148, 321]], counts: [[428635, 395116, 316524, 271746, 286773, 439491, 516003, 476377, 401463, 416505, 489303, 503154, 499935, 478597, 454399, 431739, 457895, 487777, 478281, 419227, 405390, 391184, 389113, 405975], [692499, 615321, 458077, 386786, 402579, 625866, 804834, 724197, 613633, 714118, 833790, 808973, 787497, 792186, 737789, 710557, 723768, 756637, 726568, 663071, 679732, 716822, 734301, 857118]]},
				{size: 70639963, name: 4, label: 'all', centroid: [104.11522990189324, 30.637064740660797], intervals: [24382896893, 20794151639], flowInformation: [[125888, 110153, 204, 125, 54900398], [198702, 176182, 762, 348, 85767164]], counts: [[1236754, 1125948, 1023658, 919596, 840408, 809185, 1001456, 1153081, 1186318, 1156032, 1105593, 1115742, 1143542, 1201606, 1178924, 1204623, 1265910, 1242406, 1267423, 1284084, 1264399, 1269226, 1306748, 1265722], [1754647, 1600435, 1441713, 1300241, 1186425, 1212726, 1493807, 1735373, 1745339, 1686976, 1630890, 1708415, 1847120, 1962399, 1837524, 1870074, 2006378, 2003936, 2060666, 2099032, 2067978, 2160895, 2315161, 2343429]]}]
	
	MongoClient.connect(url, function(err, db) {
		if(err) console.log('connection error');
		var collection = db.collection('kmeansData');

		var index;
		for(index in data) {
			console.log(data);
			collection.insert(data[index]);
		}

	});
});

router.get('/processAllData', function (req, res) {
	var mapOptions = {
		collectionName: 'districtData',
		condition: {},
		callback: function(result) {
			var i, j
				, flowInformation = {weekend: [], weekdays: []}, clusters = {}
				, label, name, intervals = {}, labels = {}
				, pos, count = 0
				;
			

			for(i = 0; i < 5; i ++) {
				var barInfomation = {weekdays: [], weekend: []};

				for(j = 0; j < 24; j ++) {
					barInfomation.weekdays[j] = 0;
					barInfomation.weekend[j] = 0;
				}
				labels[number2District(i)] = [];

				clusters[number2District(i)] = {
					centroid: [0, 0], 
					name: number2District(i), 
					intervals: {weekdays: 0, weekend: 0},
					barInfomation: barInfomation,
					size: 0,
					count: 0
				}
				flowInformation.weekend[i] = [];
				flowInformation.weekdays[i] = [];

				for(j = 0; j < 5; j ++) {
					flowInformation.weekend[i][j] = 0;
					flowInformation.weekdays[i][j] = 0;
				}
			}

			for(i = 0; i < result.length; i ++) {
				name = result[i].name;
				pos = districtToNumber(name);
				if(isNaN(result[i].centroid[1]) || isNaN(result[i].centroid[0])) {
					continue ;
				}
				// if(!exists(result[i].label, labels[name])) {
				// 	labels[name].push(result[i].label);
				// 	clusters[name].count ++;
				// }

				clusters[name].size = clusters[name].size + result[i].size;

				clusters[name].barInfomation.weekdays = add(clusters[name].barInfomation.weekdays, result[i].counts[1]);
				clusters[name].barInfomation.weekend = add(clusters[name].barInfomation.weekend, result[i].counts[0]);

				clusters[name].intervals.weekdays = clusters[name].intervals.weekdays + result[i].intervals[1];
				clusters[name].intervals.weekend = clusters[name].intervals.weekend + result[i].intervals[0];

				flowInformation.weekend[pos] = add(flowInformation.weekend[pos], result[i].flowInformation[0]);
				flowInformation.weekdays[pos] = add(flowInformation.weekdays[pos], result[i].flowInformation[1]);
			}

			for(i in clusters) {
				clusters[i].centroid = centroids[i];
				var countTemp = 0;
				for(j = 0; j < 24; j ++) {
					countTemp += clusters[i].barInfomation.weekdays[j];
					countTemp += clusters[i].barInfomation.weekend[j];
				}
				console.log(i, countTemp);
			}

			for(i = 0; i < 5; i ++) {
				flowInformation.weekend[i][i] = 0;
				flowInformation.weekdays[i][i] = 0;
			}

			return {
				clusters: clusters,
				flowInformation: flowInformation
			};

		} // end of callback
	} // end of mapOption

	connectToDataBase(mapOptions, res);
});

function exists(label, labels) {
	for(var i = 0; i < labels.length; i ++) {
		if(labels[i] == label) return true;
	}
	return false;
}

// router.get('/getBasePoint', function (req, res) {
// 	var labels = [ "A-TY658"
// 				   , "A-TK125"
// 				   , "A-TQ017"
// 				   , "A-TL188"
// 				   , "A-TK501"
// 				   , "A-TG911"
// 				   , "A-TD375"
// 				   , "A-TA977"
// 				   // , "A-TP509"
// 				   // , "A-TA126" 
// 				   ];

// 	var condition = {label: {$in: labels}};
// 	condition.longitude = {$gte: MINLONGITUDE, $lte: MAXLONGITUDE};
// 	condition.latitude = {$gte: MINLATITUDE, $lte: MAXLATITUDE};

// 	var centroids = [[104.05787215207015, 30.631425802131375]
// 					,[104.08197798029491, 30.68708059362673]
// 					,[104.01588851491137, 30.678242560651444]
// 					,[103.98579796661397, 30.595779120391207]
// 					,[104.11522990189324, 30.637064740660797]];

// 	MongoClient.connect(url, function(err, db) {
// 		if(err) console.log('connection error');
// 		var collection = db.collection('complexLab_trans');

// 		collection.find(condition).toArray(function(err, result) {
// 			if(err) {
// 				console.log(err);
// 				db.close();
// 				return ;
// 			}
// 			var i, j
// 				, points = [], polygon = [], polygon_ = []
// 				, minDiatance, distance
// 				;

// 			for(i = 0; i < centroids.length; i ++) {
// 				polygon[i] = {points: []};
// 			}

// 			for(i = 0; i < result.length; i ++) {
// 				minDiatance = Number.MAX_VALUE;

// 				for(j = 0; j < centroids.length; j ++) {
// 					distance = Distance(centroids[j], [result[i].longitude, result[i].latitude]);
// 					if(minDiatance > distance) {
// 						index = j;
// 						minDiatance = distance;
// 					}
// 				}
// 				polygon[index].points.push(turf.point([result[i].longitude, result[i].latitude], {index: index }));

// 				// polygon[index].points.push(turf.point([result[i].longitude - 0.0025, result[i].latitude + 0.0025], {index: index }));

// 			}
// 			for(i = 0; i < centroids.length; i ++) {
// 				polygon_[i] = turf.convex(turf.featureCollection(polygon[i].points));
// 			}
// 			res.send(polygon_);
// 			db.close();
// 		});
// 	});
// });

router.get('/getBasePoint', function(req, res) {
	MongoClient.connect(url, function(err, db) {
		if(err) console.log('connection error');
		var collection = db.collection('KMeansBoundaries');
		collection.find({}).toArray(function(err, result) {
			res.send(result);
		});
	});
})

var Distance = function (centroid, item) {
	var from = turf.point([centroid[0], centroid[1]]);
	var to = turf.point([item[0], item[1]]);
	var distance = turf.distance(from, to, 'kilometers') * 1000;
	return distance;
};

function add(arr1, arr2) {
	var arr3 = [];
	for(var i = 0; i < arr1.length; i ++) {
		arr3[i] = arr1[i] + arr2[i];
	}
	return arr3;
}

function number2District(num) {
	switch(num) {
		case 0: return "jinNiu";
		case 1: return "jinJiang";
		case 2: return "qingYang";
		case 3: return "wuHou";
		case 4: return "chengHua";
	}
}

router.get('/processedData', function(req, res) {
	var label = req.query.label
		, condition = {label: label} 
		;

	var mapOptions = {
		condition: condition,
		collectionName: 'districtData',
		callback: function (result) {
					  var i, index
					  	  , flowInformation = {weekend: [], weekdays: []}, clusters = {}
					  	  , element
					  	  ;
					  for(i = 0; i < result.length; i ++) {
					  	element = result[i];
					  	index = districtToNumber(element.name);
					  	clusters[element.name] = {
					  		label: element.label,
					  		centroid: element.centroid,
					  		barInfomation: {
					  			weekend: element.counts[0],
					  			weekdays: element.counts[1]
					  		},
					  		intervals: {
					  			weekdays: element.intervals[1],
					  			weekend: element.intervals[0]
					  		},
					  		size: element.size
					  	} //  end of clusters
					  	element.flowInformation[1][index] = 0;
					  	element.flowInformation[0][index] = 0;

					  	flowInformation.weekdays[i] = element.flowInformation[1];
					  	flowInformation.weekend[i] = element.flowInformation[0];
					  }

					  	for(i in clusters) {
							clusters[i].centroid = centroids[i];
							console.log('weekdays', clusters[i].barInfomation.weekdays);
							console.log('weekend', clusters[i].barInfomation.weekend);
						}
					  result = {};
					  result.clusters = clusters;
					  result.flowInformation = flowInformation;
				  	  return result;
				  }
	};

	connectToDataBase(mapOptions, res);
});

router.get('/roadDataTemp', function(req, res) {
	var condition = {};
	var mapOptions = {
		find: 'true',
		condition: condition,
		collectionName: 'districtData',
		callback: function(result) {
			var i, j, oldSpeeds, oldCen, oldFlow, flag = true;
			var r = {};
			var label, name, fm, c, s, size;
			console.log(result.length);

			for(i = 0; i < result.length; i ++) {
				label = result[i].label;
				name = result[i].name;
				fm = result[i].flowMatrix;
				s = result[i].speeds;
				c = result[i].centroid;
				size = result[i].size;

				if(name in r) {
					oldSpeeds = r[name].speeds;
					oldCen = r[name].centroid;
					oldFlow = r[name].flowMatrix;
					oldCount = r[name].count;

					for(j = 0; j < s.length; j ++) {
						if(isNaN(s[j])) {
							r[name].speeds = oldSpeeds;
							flag = false;
							break ;
						} else {
							r[name].speeds[j] += s[j];
						}
					}

					for(j = 0; j < fm[0].length; j ++) {
						if(isNaN(s[j])) {
							r[name].flowMatrix = oldFlow;
							flag = false;
							break ;
						} else {
							r[name].flowMatrix[0][j] += fm[0][j];
							r[name].flowMatrix[1][j] += fm[1][j];
						}
						
					}

					for(j = 0; j < c.length; j ++) {
						if(isNaN(s[j])) {
							r[name].centroid = oldCen;
							flag = false;
							break ;
						} else {
							r[name].centroid[j] += c[j];
						}
						
					}
					if(flag) {
						r[name].count ++;
						r[name].size += size;

					}
					flag = true;
				}else {
					if(name) {
						r[name] = {
							name: name,
							label: 'all',
							flowMatrix: fm,
							centroid: c,
							size: size,
							speeds: s,
							count: 0
						};
					}

				}
			}
			var count;

			for(name in r) {
				count = r[name].count;

				for(j = 0; j < s.length; j ++) {
					r[name].speeds[j] /= count;
				}

				for(j = 0; j < fm[0].length; j ++) {
					r[name].flowMatrix[0][j] /= count;
					r[name].flowMatrix[1][j] /= count;
					r[name].flowMatrix[0][j] = parseInt(r[name].flowMatrix[0][j]);
					r[name].flowMatrix[1][j] = parseInt(r[name].flowMatrix[1][j]);
				}

				for(j = 0; j < c.length; j ++) {
					r[name].centroid[j] /= count;
				}

				r[name].size = parseInt(r[name].size / count);
			}

			return r;
		}
	};
	connectToDataBase(mapOptions, res);
});

router.get('/Regionsflow', function (req, res) {
	var label = req.query.label;
	var condition = {};
	var labels = [];
	if(label) condition.label = label;
	condition.longitude = {$gte: MINLONGITUDE, $lte: MAXLONGITUDE};
	condition.latitude = {$gte: MINLATITUDE, $lte: MAXLATITUDE};

	var flow = function(result) {
		result = preprocessingTaxiData(result);
		getFlowInformation(result, res);
	}

	var mapOptions = {
		condition: condition,
		collectionName: 'complexLab_trans',
		callback: flow
	}

	MongoClient.connect(url, function(err, db) {
		if(err) console.log('connection error');
		var collection = db.collection(co);
		collection.find(condition).toArray(function(err, result) {
			connectToDataBase(mapOptions, res);
			db.close();
		});
	});
});				

function preprocessingTaxiData(result) {
	var Info = {}, index;
	Info.data = {};
	Info.date = [];
	var ctime;

	for(index in result) {
		var element = result[index];

		try{
			ctime = strftime('%Y-%m-%d', element['cTime']);
		} catch(error) {
			console.log(ctime);
		}
		if(ctime in Info.data) {
			Info.data[ctime].push([parseFloat(element.longitude),parseFloat(element.latitude), element.cTime]);
		} else {
			Info.data[ctime] = [[parseFloat(element.longitude),parseFloat(element.latitude), element.cTime]];
		}
	}
	for(index in Info['data']) {
		var element = Info.data[index];
		Info['date'].push(index);
	}
	Info['date'] = Info['date'].sort();
	return Info;
};

function getFlowInformation(result, res) {
	var flowInfomationCallback = function (districts) {
		var lastLocation, currentLocation, flowInfomation = {'weekend': [], 'weekdays': []};
		var ctime, ptime, day;
		for(var i = 0; i < result.date.length; i ++) {
			var element = result.data[result.date[i]];
			var day = (new Date(result.date[i])).getDay();
			for(var j = 0; j < element.length; j ++) {
				var item = element[j];
				currentLocation = [item[0], item[1]];
				if(!lastLocation) lastLocation = currentLocation;
				var from = getDistrict(lastLocation, districts);
				var to = getDistrict(currentLocation, districts);

				if(from == null || to == null) continue ;

				if(!isInTheSameDistrict(from, to)) {
					if(day == 0 || day == 6) {
						updateFlowInformation(from, to, flowInfomation['weekend']);
					} else {
						updateFlowInformation(from, to, flowInfomation['weekdays']);
					}
				}
				lastLocation = currentLocation;
			} // end of for - j
			
		}// end of for - i
		res.send(flowInfomation);
	}
	analysisDistrictData(flowInfomationCallback);
};	

function analysisDistrictData(callback) {
	var readFileAsync = function(name){
	    return new Promise(function(resolve, reject){
	        fs.readFile(name, function(err, data){
	            if(err) {
	                reject(err);
	            } else {
	                resolve(data);
	            }
	        });
	    });
	};

	var chengHuaQuData, jinJiangQuData, qingYangQuData, wuHouQuData, jinNiuQuData;
	var chengHuaPoly, jinJiangPoly, qingYangPoly, wuHouQuPoly, qingYangPoly, jinNiuPoly;

	readFileAsync('./data/chengHuaQu') 
		.then(function(data1){
			chengHuaPoly = getGeoObject(data1);
		    return readFileAsync('./data/jinJiangQu');
		})
		.then(function(data2){
			jinJiangPoly = getGeoObject(data2);
		    return readFileAsync('./data/qingYangQu');
		})
		.then(function(data3){
			qingYangPoly = getGeoObject(data3);
		    return readFileAsync('./data/wuHouQu');
		})
		.then(function(data4){
			wuHouPoly = getGeoObject(data4);
		    return readFileAsync('./data/jinNiuQu');
		})
		.then(function(data5) {
			jinNiuPoly = getGeoObject(data5);
			var flowInfomation = [];
			var districts = {chengHua: chengHuaPoly, jinJiang: jinJiangPoly, qingYang: qingYangPoly, 
							 wuHou: wuHouPoly, jinNiu: jinNiuPoly};

			callback(districts);
		})
		.catch(function(err){
		    console.error(err)
		});
};

router.get('/getDistrictsData', function(req, res) {
	analysisDistrictData(function(districts) {
		res.send(districts);
	});
});

function updateFlowInformation(from, to, flowInfomation) {
	var i = 0;

	for(i = 0; i < flowInfomation.length; i ++) {
		if(flowInfomation[i].from == from && flowInfomation[i].to == to) {
			flowInfomation[i].count ++;
			break;
		}
	}
	if(i == flowInfomation.length) {
		flowInfomation.push({from: from, to: to, count: 0});
	}
};

function isInTheSameDistrict(from, to) {
	if(from == to) return true;
	return false;
};

function getDistrict(location, districts) {
	var itemGeo = turf.point(location);
	for(var index in districts) {
		if(turf.inside(itemGeo, districts[index])) {
			return index;
		}
	}
	return null;
};

router.get('/saveRoadData', function(req, res) {
	var data = req.query.data;
	MongoClient.connect(url, function(err, db) {
		var collection = db.collection('complexLab_road');
		collection.insert(data);
		res.send('all saved!');
		db.close();
	});
});	

router.get('/clipRoadData', function (req, res) {
	var features = [];
	for(var i = 0; i < roadNet.features.length; i ++) {
		var element = roadNet.features[i];
		var length = roadNet.features[i].coordinates.length;
		var coords = [];
		for(var j = 0; j < length; j ++) {
			var item = roadNet.features[i].coordinates[j];
			coords.push([item[0], item[1]]);
		}
		features.push(turf.lineString(coords));
	}
	features = turf.featureCollection(features);
	res.send(features);
});

/**
 * get all labels
 */
router.get('/getLabels', function (req, res) {
	var hint = req.query.q;
	var collectionName = req.query.collectionName;
	var condition = {};
	if(hint) condition.label = new RegExp(hint);
	var options = {
		"skip": 0
	};

	var findLabels = function(result) {
		var labels = [];
		var cars = [];
		for(index in result) {
			labels.push(result[index].label);
		}
		labels = labels.join();
		return labels;
	}

	var mapOptions = {
		condition: condition,
		callback: findLabels,
		options: options,
		collectionName: collectionName
	}

	connectToDataBase(mapOptions, res);
});

/**
* 	input : label
    output :
        carData{
            'date': [**,**]
            'speed' : [**,**]
        }
*/
router.get('/getSpeed', function (req, res) {
	var label = req.query.label;
	var condition = {};
	if(label) condition.label = label;
	condition.longitude = {$gte: MINLONGITUDE, $lte: MAXLONGITUDE};
	condition.latitude = {$gte: MINLATITUDE, $lte: MAXLATITUDE};
	var collectionName = 'complexLab_trans';
	var speedInfo = function(result) {return getSpeedInfo(result);}
	var mapOptions = {
		condition: condition,
		callback: speedInfo,
		collectionName: collectionName
	};
	connectToDataBase(mapOptions, res);
});

// lat: result[i].latitude - 0.006, lng: result[i].longitude - 0.0065
router.get('/heatmapData', function (req, res) {
	MongoClient.connect(url, function(err, db) {
		if(err) console.log('connection error');
		var collection = db.collection('complexLab_trans');
		collection.find({'label':'A-TA001'}).toArray(function(err, result) {
			var heatMapMatrix = {};
			var Info = [];
			var loc = -1;
			for(var i = 0; i < result.length; i ++) {
				if((loc = isLocationExist([result[i].longitude, result[i].latitude])) == -1) {
					heatMapMatrix[locations.length] = {lat: result[i].latitude, lng: result[i].longitud, count: 1};
					locations.push([result[i].latitude, result[i].longitude]);
				} else {
					console.log(heatMapMatrix[String(loc)].count);
					heatMapMatrix[String(loc)].count ++;
				}
			}

			for(index in heatMapMatrix) {
				Info.push(heatMapMatrix[index]);
			}

			res.send(Info); 
			db.close();
		});
	});
});

router.get('/savePOIData', function (req, res) {
	var poiData = req.query.data;
	var type = req.query.type;
	var url = 'mongodb://localhost/lab';

	MongoClient.connect(url, function (err, db) {
		var collection = db.collection('complexLab_poi');
		for(var i = 0; i < poiData.length; i ++) {
			var poi = poiData[i];
			collection.insert({
				'poiName':poiData[i].name,
				'lat': parseFloat(poiData[i].location[1]),
				'lng': parseFloat(poiData[i].location[0]),
				'type': type
		    });

		}
		db.close();
	});
	res.send('saved!');
});

function isLocationExist(location) {
	for(var i = 0; i < locations.length; i ++) {
		if(locations[i][0] == location[0] && locations[i][1] == locations[i][1]) {
			return i;
		}
	}
	return -1; 
};

/**
* 	input : result
*   output :
*      Info: 
*      	data: 
*      		location: [[longitude, latitude], [longitude, latitude], ... , [longitude, latitude]]
*      		ptime: ['%H:%M:%S', '%H:%M:%S', ... , '%H:%M:%S']
*      		timestamp: [long, long, ... , long]
*      		speed: [speed, speed, ... , speed]
*      	date: ['%Y-%m-%d', '%Y-%m-%d', ... , '%Y-%m-%d']
*/

function getSpeedInfo (result) {
	var ctime, ptime, currentTime, currentLocation, lastLocation, timeArray, timestamp, isService;
	var lastService = 0;
	var Info = {};
	Info['data'] = {};
	var max = -1;

	for(index in result) {
		var element = result[index];
		try {
			// 获取现在的时间
			timestamp = parseInt(Date.parse(element['cTime'])) ;
			ctime = strftime('%Y-%m-%d', element['cTime']);
			ptime = strftime('%H:%M:%S', element['cTime']);
			timeArray = strftime('%Y-%m-%d %H:%M:%S', element['cTime']);
			timestamp = parseInt(Date.parse(element['cTime']));
			isService = element.isService;
		} catch (e) {
			console.log(element.cTime);
			console.log('error');
			continue;
		}
		currentLocation = [parseFloat(element.longitude), parseFloat(element.latitude)];

		if(ctime in Info['data']) {
			timeInterval = parseFloat(timestamp - lastTime) / 1000;
			if(timeInterval == 0) {
				lastTime = timestamp;
				lastLocation = currentLocation;
				continue;
			}

			// 过滤掉不合理的距离
			var distance = getDistance(lastLocation, currentLocation) * 1000;
			if(distance > 6000) {
				lastTime = timestamp;
				lastLocation = currentLocation;
				continue;
			}

			// 计算该段路径的速度 m/s
			var speed = getDistance(lastLocation, currentLocation) * 1000 / timeInterval;

			// 过滤掉不合理的速度
			if(speed > 50) {
				lastTime = timestamp;
				lastLocation = currentLocation;
				continue;
			}

			max = max > speed ? max : speed;

			Info['data'][ctime]['location'].push([lastLocation, currentLocation]);
			Info['data'][ctime]['ptime'].push(ptime);
			Info['data'][ctime]['timestamp'].push(timestamp);
			Info['data'][ctime]['speed'].push(speed);
		} else {
			Info['data'][ctime] = {};
			Info['data'][ctime]['location'] = [];
			// Info['data'][ctime]['location'] = [currentLocation];
            Info['data'][ctime]['ptime'] = [ptime];
            Info['data'][ctime]['timestamp'] = [];
            Info['data'][ctime]['speed'] = [];
		}
		lastTime = timestamp;
		lastLocation = currentLocation;
	}
	Info['date'] = [];
	for(index in Info['data']) {
		Info['date'].push(index);
	}
	Info['date'] = Info['date'].sort();
	Info['maxSpeed'] = max;
	return Info;
};

/**
* 	input : lastLocation, currentLocation
*   output :
*      distance: s // km
*/

function getDistance (lastLocation, currentLocation) {
	var EARTH_RADIUS = 6378.137; //地球半径

	var radLat1 = rad(lastLocation[1]);
	var radLat2 = rad(currentLocation[1]);
	var a = radLat1 - radLat2;
	var b = rad(lastLocation[0]) - rad(lastLocation[0]);
	var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2)
                + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
	 s = s * EARTH_RADIUS;
     s = Math.round(s * 10000) / 10000;
     return s;
};

function rad (d) {
    return d * Math.PI / 180.0;
};

/**
* 	input : hint
    output :
        labels: [**,**] length = 10
*/
router.get('/gethint', function (req, res) {
	// var url = "mongodb://192.168.1.161/lab";
	var hint = req.query.q;
	var condition = {};
	var labels = [];
	if(hint) condition.label = new RegExp(hint);
	var options = {
	    "limit": 10,
	    "skip": 0
	}

	var findLabels = function (result) {
		var cars = [];
		for(index in result) {
			labels.push(result[index].label);
		}
		return labels.join();
	}

	var mapOptions = {
		condition: condition,
		options: options,
		callback: findLabels,
		collectionName: 'complexLab_label'
	}
	connectToDataBase(mapOptions, res);
});

function getAverageSpeedPerHour(points, times) {
	var speeds = getSpeed(points, times);
	for(index in speeds) {
		speeds[index].speed /= speeds[index].location.length;
		if(isNaN(speeds[index].speed)) {
			speeds[index].speed = -1;
		} else if(speeds[index].speed < 0) {
			speeds[index].speed = - speeds[index].speed;
		}
		delete speeds[index].location;
	}

	return speeds;
};

function getRoadSegementSpeeds(points, times) {
	var ctime, hour, day, currentTime, currentLocation, lastLocation, timestamp, lastTime;
	var lastService = 0;
	var Info = {};
	var max = -1;
	for(var index in points) {
		var element = points[index];
		try {
			// 获取现在的时间
			timestamp = parseInt(Date.parse(times[index]));
			hour = parseInt(strftime('%H:%M:%S', times[index]));
			day = parseInt(strftime('%Y-%m-%d', times[index]).split('-')[2]);
		} catch (e) {
			console.log(element.cTime);
			console.log('error');
			continue;
		}

		currentLocation = [parseFloat(element.longitude), parseFloat(element.latitude)];

		if(day in Info) {
			if(hour in Info[day]) {
				timeInterval = parseFloat(timestamp - lastTime) / 1000;
				if(timeInterval == 0) {
					lastTime = timestamp;
					lastLocation = currentLocation;
					continue;
				}

				// 过滤掉不合理的距离
				var distance = getDistance(lastLocation, currentLocation) * 1000;
				if(distance > 6000) {
					lastTime = timestamp;
					lastLocation = currentLocation;
					continue;
				}

				// 计算该段路径的速度 m/s
				var speed = getDistance(lastLocation, currentLocation) * 1000 / timeInterval;

				// 过滤掉不合理的速度
				if(speed > 56) {
					lastTime = timestamp;
					lastLocation = currentLocation;
					continue;
				}

				max = max > speed ? max : speed;

				Info[day][hour]['location'].push([lastLocation, currentLocation]);
				Info[day][hour]['speed'] += speed;

			} else { // end of if hour
				Info[day][hour] = {};
				Info[day][hour]['location'] = [];
	            Info[day][hour]['speed'] = 0;
			}
		} else { // end of if - day
			Info[day] = {};
		}

		lastTime = timestamp;
		lastLocation = currentLocation;
	}

	for(day in Info) {
		for(hour in Info[day]) {
			Info[day][hour].speed /= Info[day][hour].location.length;
			if(Info[day][hour].speed < 0) Info[day][hour].speed = - Info[day][hour].speed;
			delete Info[day][hour].location;
		}
	}
	return Info;
};

function getSpeed(points, times) {
	var ctime, hour, day, currentTime, currentLocation, lastLocation, timestamp, isService;
	var lastService = 0;
	var Info = {};
	var max = -1;
	for(var index in points) {
		var element = points[index];
		try {
			// 获取现在的时间
			timestamp = parseInt(Date.parse(times[index]));
			hour = parseInt(strftime('%H:%M:%S', times[index]));
			day = strftime('%Y-%m-%d', times[index]);
		} catch (e) {
			console.log(element.cTime);
			console.log('error');
			continue;
		}
		currentLocation = [parseFloat(element.longitude), parseFloat(element.latitude)];

		if(hour in Info) {
			timeInterval = parseFloat(timestamp - lastTime) / 1000;
			if(timeInterval == 0) {
				lastTime = timestamp;
				lastLocation = currentLocation;
				continue;
			}

			// 过滤掉不合理的距离
			var distance = getDistance(lastLocation, currentLocation) * 1000;
			if(distance > 6000) {
				lastTime = timestamp;
				lastLocation = currentLocation;
				continue;
			}

			// 计算该段路径的速度 m/s
			var from = turf.point(lastLocation);
			var to = turf.point(currentLocation);
			var distance = turf.distance(from, to, 'kilometers') * 1000;
			// var speed = getDistance(lastLocation, currentLocation) * 1000 / timeInterval;
			var speed = distance / timeInterval;

			// 过滤掉不合理的速度
			if(speed > 50) {
				lastTime = timestamp;
				lastLocation = currentLocation;
				continue;
			}
			max = max > speed ? max : speed;

			Info[hour]['location'].push([lastLocation, currentLocation]);
			Info[hour]['speed'] += speed;
		} else {
			Info[hour] = {};
			Info[hour]['location'] = [];
            Info[hour]['speed'] = 0;
		}
		lastTime = timestamp;
		lastLocation = currentLocation;
	}

	return Info;
};

/**
* 	input : label
    output :
        cluster: [[], [], []] k-means方法分组后的经纬值坐标
*/

function getGeoObject(buffer) {
	var dataBuffer = new Buffer(buffer);
	var data = JSON.parse(dataBuffer.toString());
	var coordinates = [];
	var times = [];
	var poly = {
	  "type": "Feature",
	  "properties": {},
	  "geometry": {
	    "type": "Polygon",
	    "coordinates": [coordinates]
	  }
	};
	for(var i = 0; i < data.polygon.length; i ++) {
		var item = data.polygon[i];
		coordinates.push([item.lng, item.lat]);
	}
	return poly;
};

function getDistrictsData(result, districts) {
	var index, district, i
		, hour
		, hourlyData = {};
		
	for(i = 0; i < result.length; i ++) {
		for(index in districts) {
			district = getDistrict([result[i].longitude, result[i].latitude], districts);
			hour = strftime('%H:%M:%S', result[i]['cTime']).split(':')[0];
			if(district != null) {
				if(hourlyData[district]) {
					if(hourlyData[district][hour]) {
						hourlyData[district][hour] ++;
					} else {
						hourlyData[district][hour] = 1;
					}
				} else {
					hourlyData[district] = {};
					hourlyData[district][hour] = 1;
				}
				break ;
		 	} //  end of if - district != null
		} 
	}
	return hourlyData;
};

function updateDistrictInformation(item, districts, clusters, flags) {
	var index, time, itemGeo = turf.point([item[0], item[1]])
		, day, hour, interval;
	try{
		time = strftime('%H:%M:%S', item[2]).split(':');
		hour = time[0];
	}catch(e) {
		console.log(item);
		return null;
	}
	

	for(index in districts) {
		if(turf.inside(itemGeo, districts[index])) {
			day = (new Date(item[2])).getDay();
			clusters[index].points.push({longitude: item[0], latitude: item[1]});
			clusters[index].times.push(item[2]);
			clusters[index].centroid[0] += item[0];
			clusters[index].centroid[1] += item[1];

			if(clusters[index].hourlyData[hour]) {
				clusters[index].hourlyData[hour] ++;
			} else {
				clusters[index].hourlyData[hour] = 1;
			}

			if(day == 0 || day == 6) {
				if(clusters[index].barInfomation.weekend[hour]) {
					clusters[index].barInfomation.weekend[hour] ++;
				} else {
					clusters[index].barInfomation.weekend[hour] = 1;
				}
			} else {
				if(clusters[index].barInfomation.weekdays[hour]) {
					clusters[index].barInfomation.weekdays[hour] ++;
				} else {
					clusters[index].barInfomation.weekdays[hour] = 1;
				}
			} // end of if - day == 0 || day == 6

			flags[index].current = parseInt(Date.parse(strftime('%Y-%m-%d %H:%M:%S', item[2]))) / 1000;
			if(flags[index].flag) {
				flags[index].flag = false;
				interval = flags[index].current - flags[index].previous;
				if(day == 0 || day == 6) {
					clusters[index].intervals.weekend += interval;
				} else {
					clusters[index].intervals.weekdays += interval;
				}
			} else {
				flags[index].flag = true;
			}
			flags[index].previous = flags[index].current;
			break ;
		} // end of if - turf.inside(item, districts[index])
	} // end of for - index in districts
};

// 区域数据分析
router.get('/districtData', function (req, res) {
	// 分类方法
	var clusters = function(result, districts) {
		// 将数据按天分类
		result = preprocessingTaxiData(result);

		var clusterInfo = {}
			// 分区数据
			, clusters = {
				wuHou: {centroid: [0, 0], points: [], times: [], name: 'wuHou', hourlyData: {}, intervals: {weekdays:0, weekend: 0}, barInfomation: {weekdays:[], weekend: []}}, 
				qingYang: {centroid: [0, 0], points: [], times: [], name: 'qingYang', hourlyData: {}, intervals: {weekdays:0, weekend: 0}, barInfomation: {weekdays:[], weekend: []}}, 
				chengHua: {centroid: [0, 0], points: [], times: [], name: 'chengHua', hourlyData: {}, intervals: {weekdays:0, weekend: 0}, barInfomation: {weekdays:[], weekend: []}}, 
				jinJiang: {centroid: [0, 0], points: [], times: [], name: 'jinJiang', hourlyData: {}, intervals: {weekdays:0, weekend: 0}, barInfomation: {weekdays:[], weekend: []}}, 
				jinNiu: {centroid: [0, 0], points: [], times: [], name: 'jinNiu', hourlyData: {}, intervals: {weekdays:0, weekend: 0}, barInfomation: {weekdays:[], weekend: []}} } 
			, flags = {
				wuHou: {flag: false, previous: null, current: null}, 
				qingYang: {flag: false, previous: null, current: null}, 
				chengHua: {flag: false, previous: null, current: null}, 
				jinJiang: {flag: false, previous: null, current: null}, 
				jinNiu: {flag: false, previous: null, current: null} 
			}
			, barInfomation = {
				wuHou: {weekdays: [], weekend: []}, 
				qingYang: {weekdays: [], weekend: []}, 
				chengHua: {weekdays: [], weekend: []}, 
				jinJiang: {weekdays: [], weekend: []}, 
				jinNiu: {weekdays: [], weekend: []} 
			}
			, wuHouAverageSpeed, qingYangAverageSpeed, chengHuaAverageSpeed, jinJiangAverageSpeed
			// 区域流动数据
			, lastLocation, currentLocation, flowInformation = {'weekend': [], 'weekdays': []}
			, ctime, ptime, day, hour, index, i, j, item, from, to, itemGeo
			, district, element, flowMatirx, time;

		for(index in result.data) {
			day = (new Date(index)).getDay();
			for(i = 0; i < result.data[index].length; i ++) {
				item = result.data[index][i];
				
				currentLocation = [item[0], item[1]];
				if(!lastLocation) lastLocation = currentLocation;
				from = getDistrict(lastLocation, districts);
				to = getDistrict(currentLocation, districts);

				// 区分两个点是否在一个区域，若不是，则更新区域流动数据，区分周末和工作日
				if(!isInTheSameDistrict(from, to)) {
					if(day == 0 || day == 6) {
						updateFlowInformation(from, to, flowInformation['weekend']);
					} else {
						updateFlowInformation(from, to, flowInformation['weekdays']);
					}
				}

				lastLocation = currentLocation;

				item = result.data[index][i]; 
				itemGeo = turf.point([item[0], item[1]]);
				updateDistrictInformation(item, districts, clusters, flags);
			}

			flags = {
				wuHou: {flag: false, previous: null, current: null}, 
				qingYang: {flag: false, previous: null, current: null}, 
				chengHua: {flag: false, previous: null, current: null}, 
				jinJiang: {flag: false, previous: null, current: null}, 
				jinNiu: {flag: false, previous: null, current: null} 
			}
		}

		for(index in clusters) {
			clusters[index].centroid[0] /= clusters[index].points.length;
			clusters[index].centroid[1] /= clusters[index].points.length;
		}

		// 计算不同区域的每小时的平均速度
		for(index in clusters) {
			clusters[index].averageSpeeds = getAverageSpeedPerHour(clusters[index].points, clusters[index].times);
		}

		// 将区域流动数据存成矩阵的形式
		flowMatirx = {weekdays: [], weekend: []};
		for(i = 0; i < 5; i ++) {
			flowMatirx.weekdays[i] = [];
			flowMatirx.weekend[i] = [];
		}

		for(index in flowInformation) {
			element = flowInformation[index];
			for(i = 0; i < element.length; i ++) {
				from = districtToNumber(element[i].from);
				to = districtToNumber(element[i].to);
				if(from == -1 || to == -1) continue ;

				flowMatirx[index][districtToNumber(element[i].from)][districtToNumber(element[i].to)] = element[i].count;
			}

		}
		for(index in flowInformation) {
			for(i = 0; i < 5; i ++) {
				for(j = 0; j < 5; j ++) {
					if(flowMatirx[index][i][j]) {
						continue ;
					}
					flowMatirx[index][i][j] = 0;
				}
			}
		}
		clusterInfo.flowInformation = flowMatirx;
		clusterInfo.clusters = clusters;

		return clusterInfo;
	};

	var clusterPoints = function (districts) {
		var condition = {};
		var label = req.query.label;
		var clusterInfo = {};
		if(label) condition.label = label;
		condition.longitude = {$gte: MINLONGITUDE, $lte: MAXLONGITUDE};
		condition.latitude = {$gte: MINLATITUDE, $lte: MAXLATITUDE};

		var mapOptions = {
			condition: condition,
			callback: clusters,
			collectionName: 'complexLab_trans',
			districts: districts
		};
		connectToDataBase(mapOptions, res);
	};

	analysisDistrictData(clusterPoints);
});

function districtToNumber(name) {
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

router.get('/saveRoadData', function (req, res) {
	var url = 'mongodb://localhost/lab';
	var condition = {};
	var roadName = req.query.roadName;
	var data = req.query.data;
	MongoClient.connect(url, function (err, db) {
		var collection = db.collection('roads');
		for(var i in data) {
			collection.insert({
				'roadName':roadName,
				'lat': parseFloat(data[i].lat),
				'lng': parseFloat(data[i].lng)
		    });
		}
		db.close();
	});
});

router.get('/trafficJamDetection', function(req, res) {
	var conditionForTrans = {};
	var roadNames = req.query.roadNames;
	var labels = req.query.labels;

	var conditionForRoads = {};
	if(roadNames.length > 0) {
		conditionForRoads.roadName = {$in: roadNames};
		conditionForTrans.name = {$in: roadNames};
	}
	if(labels.length > 0) conditionForTrans.label = {$in: labels};
	var roadDataArr = {};
	var roads = [];

	MongoClient.connect(url, function (err, db) {
		var collection = db.collection('complexLab_roads');
		collection.find(conditionForRoads).toArray(function(err, result) {
			 if(err) {
			 	console.log(err);
			 } else {
			 	for(var index in result) {
			 		var name = result[index].roadName;
			 		if(!(name in roadDataArr)) {
			 			roadDataArr[name] = {
			 				centroid: turf.point([result[index].lng, result[index].lat])
			 			};
			 		}
			 	}

			 	MongoClient.connect(url, function (err, db) {
					var collection = db.collection('roadData');

					console.log(conditionForTrans);

					collection.find(conditionForTrans).toArray(function(err, result_) {
						var i, element
							, date, name
							, roadData = {}, roadCount = {}
							, averageSpeeds = [], counts = []
							;

						for(i = 0; i < result_.length; i ++) {
							element = result_[i];
							name = element.name;
							for(date in element) {
								if(date.match(/^[0-9]{4}[-][0-9]{1}[-][0-9]$/) || date.match(/^[0-9]{4}[-][0-9]{1}[-][0-9]{2}$/)) {
									var day = date.split('-')[2];
									if(name in roadData) {
										if(day in roadData[name]) {
											roadData[name][day] = updateSpeedArray(roadData[name][day], result_[i][date]);
											roadCount[name][day] = updateCountArray(roadCount[name][day], result_[i][date]);
										} else {
											roadData[name][day] = initSpeedArray(result_[i][date]);
											roadCount[name][day] = initCountArray(result_[i][date]);
										}
									} else {
										roadData[name] = {};
										roadCount[name] = {};
										roadData[name][day] = result_[i][date];
										roadCount[name][day] = initCountArray(result_[i][date]);
									}
								}
							}
						}

						roadData = averageRoadSpeed(roadData, roadCount);

						for(index in roadData) {
							roadDataArr[index].info = roadData[index];
						}


						res.send(roadDataArr);
						db.close();
					});
				});
			 }
   			 db.close();
   		});
	});
});

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

function initSpeedArray(speeds) {
	var speeds_ = [];
	for(var i = 0; i < speeds.length; i ++) {
		if(!isNaN(speeds[i])) {
			speeds_[i] = speeds[i];
		} else {
			console.log(speeds[i]);
			speeds_[i] = 0;
		}
	}
	return speeds_;
}

function updateSpeedArray(oldSpeeds, speeds) {
	for(var i = 0; i < speeds.length; i ++) {
		if(speeds[i] != 0) {
			oldSpeeds[i] += speeds[i];
		}
	}
	return oldSpeeds;
}

router.get('/saveInfo', function (req, res){
	var features = req.query.features;
	var roadName = req.query.roadName;
	var url = 'mongodb://localhost/lab';

	MongoClient.connect(url, function (err, db) {
		var collection = db.collection('complexLab_roads');
		for(var i in features) {
			collection.insert({
				'roadName':roadName,
				'lat': parseFloat(features[i].geometry.coordinates[1]),
				'lng': parseFloat(features[i].geometry.coordinates[0])
		    });
		}
		res.send('saved!');
		db.close();
	});
});

router.get('/drawRoad', function(req, res) {
	var roadName = req.query.roadName;
	var url = 'mongodb://localhost/lab';
	var condition = {roadName: roadName};
	MongoClient.connect(url, function (err, db) {
		var collection = db.collection('roads');
		collection.find(condition).toArray(function(err, result) {
			 var points = [];
			 for(var i = 0; i < result.length; i ++){
			 	// points.push(turf.point([result[i].lng, result[i].lat]));
			 	points.push([result[i].lng, result[i].lat]);
			 }
			 points = sortPoints(points);
	      	 res.send(points);
			 db.close();
		});
	});
});

/**
 * 	  input : label
 *    output :
 *        carInfo: {
 *        	'data':[[**,**], [**,**]] // 出租车的轨迹信息，按日期分类
 *        	'date':[**,**] // 排序后的日期
 *        }
*/

router.get('/allTraces', function (req, res) {
	var collection_name = null;
	var condition = {};
	var label = req.query.label;

	if(label[0] == 'A') {
    	collection_name = 'complexLab_trans';
    } else {
    	collection_name = 'complexLab_bus';
    }

	if(label) condition.label = label;
	condition.longitude = {$gte: MINLONGITUDE, $lte: MAXLONGITUDE};
	condition.latitude = {$gte: MINLATITUDE, $lte: MAXLATITUDE};
	MongoClient.connect(url, function(err, db) {
		if(err) console.log('connection error');

		var collection = db.collection(collection_name);
		collection.find(condition).toArray(function(err, result) {
			if (err) {
				console.log(err);
				return res.send('233');
			}
			if (!result) return res.send('2333');

			var Info = preprocessingTaxiData(result);
			res.send(Info);
			db.close();
		});
	});
});

router.get('/KMeansData', function (req, res) {
	var condition = {};
	var label = req.query.label;
	if(label) condition.label = label;

	MongoClient.connect(url, function(err, db) {
		if(err) console.log('connection error');
		var collection = db.collection('kmeansData');
		collection.find(condition).toArray(function(err, result) {
			if(err) {
				console.log(err);
				db.close();
				return ;
			}	

			var i, index
			  	, flowInformation = {weekend: [], weekdays: []}, clusters = {}
			  	, element
			  	;
			for(i = 0; i < result.length; i ++) {
			  	element = result[i];
			  	index = element.name;
			  	name = number2District(index);
			  	

			  	clusters[name] = {
			  		label: element.label,
			  		centroid: element.centroid,
			  		barInfomation: {
			  			weekend: element.counts[0],
			  			weekdays: element.counts[1]
			  		},
			  		intervals: {
			  			weekdays: element.intervals[1] * 1000,
			  			weekend: element.intervals[0] * 1000
			  		},
			  		size: element.size
			  	} //  end of clusters
			  	element.flowInformation[1][index] = 0;
			  	element.flowInformation[0][index] = 0;

			  	flowInformation.weekdays[i] = element.flowInformation[1];
			  	flowInformation.weekend[i] = element.flowInformation[0];
			}

			console.log(flowInformation);

			result = {};
			result.clusters = clusters;
			result.flowInformation = flowInformation;
			res.send(result);
			db.close();
		});
	});

	// var cb = function (result) {
	// 	var cluster = new Cluster();
	// 	cluster.setData(result);
	// 	var clusters = cluster.k_means([[104.0498461, 30.6658641],[104.0542872, 30.6733147],[104.0347943, 30.6812716],
	// 									[104.053065, 30.6398633],[104.0967494, 30.6600458]]);

	// 	return cluster;
	// }

});

var Cluster = function () {
	this.data = [];
	this.clusters = [];

	this.setData = function(data) {
		this.data = data;
	}

	this.iterate = function (centroids) {
		var distances = [], distance, len
			, min, index = -1, i, j, k
			, newCentroids = [];

		for(k = 0; k < centroids.length; k ++) {
			newCentroids[k] = [0, 0];
		}

		for(i = 0; i < this.data.length; i ++) {
			min = Number.MAX_VALUE;
			index = -1;
			var item = this.data[i];

			for(j = 0; j < centroids.length; j ++) {
				distance = this.getDistance(centroids[j], [item.longitude, item.latitude]);
				if(min > distance) {
					index = j;
					min = distance;
				}
			} // end of for - j 
			this.clusters[index].points.push(item);
			this.clusters[index].times.push(item.cTime);

			newCentroids[index][0] += item.longitude;
			newCentroids[index][1] += item.latitude;
		} // end of for - i


		for(k = 0; k < centroids.length; k ++) {
			len = this.clusters[k].points.length;
			if(len == 0) continue ;
			try {
				newCentroids[k][0] = newCentroids[k][0] / len;
				newCentroids[k][1] = newCentroids[k][1] / len;
			}catch(e) {
				console.log(len)
			}
		}
		return newCentroids;
	};

	this.initCentroids = function() {
		var flag = true	
			, count = 0
			, pos = [], N = 5, i, item
			, centroids = [];
		for(i = 0; i < N; i ++) {
			item = this.data[parseInt(Math.round(this.data.length * Math.random()))];
			centroids[i] = [item.longitude, item.latitude];
		}
		return centroids;
	}

	this.init = function (centroids) {
		this.clusters = [];
		for(var i = 0; i < centroids.length; i ++) {
			this.clusters.push({centroid: centroids[i], points: [], times: [] });
		}
	};

	this.isChange = function (lastCentroids, currentCentroids) {
		for(var i = 0; i < lastCentroids.length; i ++) {
			if(this.getDistance(lastCentroids[i], currentCentroids[i]) != 0) {
				return true;
			}
		}
		return false;
	};

	this.getDistance = function (centroid, item) {
		var from = turf.point([centroid[0], centroid[1]]);
		var to = turf.point([item[0], item[1]]);
		var distance = turf.distance(from, to, 'kilometers') * 1000;
		return distance;
	};

	this.k_means = function (centroids) {
		centroids = centroids || this.initCentroids();
		var isIterate = true;
		var currentCentroids = centroids;
		var lastCentroids = currentCentroids;
		var count = 0;
		while(isIterate) {
			this.init(currentCentroids);
			currentCentroids = this.iterate(lastCentroids);
			if(!this.isChange(lastCentroids, currentCentroids)) {
				isIterate = false;
			}
			lastCentroids = currentCentroids;
		}
		return this.clusters;
	};
	return this;
};

module.exports = router;