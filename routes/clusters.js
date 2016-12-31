var Cluster = function (data) {
	this.data = data;
};

Cluster.prototype.data = [];

Cluster.prototype.k_means = function (centroids) {
	var isIterate = true;
	var currentCentroids = centroids;
	var lastCentroids = currentCentroids;

	while(isIterate) {
		init(currentCentroids);
		currentCentroids = iterate(this.data, lastCentroids);
		if(!isChange(lastCentroids, currentCentroids)) {
			isIterate = false;
		}
		lastCentroids = currentCentroids;
	}

	return this.clusters;
}

Cluster.prototype.iterate = function (data, centroids) {
	var item;
	var distances = [];
	var min = 100000000000, index = -1;
	var newCentroids = [];

	for(var k = 0; k < centroids.length; k ++) {
		newCentroids[k] = 0;
	}

	for(var i = 0; i < data; i ++) {
		item = data[i];

		for(var j = 0; j < centroids.length; j ++) {
			if(min > this.getDistance(item, centroids[j])) {
				index = j;
				min = this.getDistance(item, centroids[j]);
			}
		} // end of for - j 

		this.clusters[index].points.push(item);
		newCentroids[index][0] += item.point[0];
		newCentroids[index][1] += item.point[1];
	} // end of for - i

	for(var k = 0; k < centroids.length; k ++) {
		newCentroids[index][0] /= clusters[k].points.length;
		newCentroids[index][1] /= clusters[k].points.length;
	}
	return newCentroids;
}

Cluster.prototype.init = function (centroids) {
	this.clusters = [];
	for(var i = 0; i < centroids.length; i ++) {
		this.clusters.push({centroid: centroids[i], points: [] });
	}
}

Cluster.prototype.isChange = function (lastCentroids, currentCentroids) {
	for(var i = 0; i < lastCentroids.length; i ++) {
		if(getDistance(lastCentroids[i], [currentCentroids[i]]) != 0) return true;
	}
	return false;
}

Cluster.prototype.getDistance = function (centroid, item) {
	return Math.sqrt(Math.pow(centroid[0] - item[0], 2) + Math.pow(centroid[1] - item[1], 2));
}

module.exports = Cluster;















