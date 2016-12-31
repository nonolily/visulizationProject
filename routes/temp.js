var fs = require('fs');
var https = require('https');

// var url = 'https://details.jd.com/normal/print.action?orderid=23456922972&PassKey=CE82F08872F4550AAA44D6430CC9F381';
var url = 'https://www.jd.com/';

https.get(url, function (res) {
	var html = '';
	res.on('data', function(data) {
		html += data;
	});
	res.on('end', function() {
		console.log(html);
	}).on('error', function(e) {
		console.log('网页代码获取出错');
	});
});