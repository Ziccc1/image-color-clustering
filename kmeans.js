function countDistance(a, b) {
  var x = a[0] - b[0];
  var y = a[1] - b[1];
  var z = a[2] - b[2];
  return x * x + y * y + z * z;
}
function findNearestCenter(point, centers) {
  var bindex = 0;
  var bdistance = countDistance(point, centers[0]);
  for (var i = 1; i < centers.length; i++) {
    var d = countDistance(point, centers[i]);
    if (d < bdistance) {
      bdistance = d;
      bindex = i;
    }
  }
  return bindex;
}
function kMeans(points, k, maxTimes) {
  var centers = [];
  var labels = [];
  var olabels = [];
  for (var i = 0; i < k; i++) {
    var index = Math.floor(i * points.length / k);
    centers.push(points[index].slice());
  }
  var rt = 0;
  for (var t = 0; t < maxTimes; t++) {
    rt = t + 1;
    var changed = false;
    for (var p = 0; p < points.length; p++) {
      var group = findNearestCenter(points[p], centers);
      labels[p] = group;
      if (olabels[p] !== group) {
        changed = true;
      }
    }
    var sum = [];
    var count = [];
    for (var s = 0; s < k; s++) {
      sum[s] = [0, 0, 0];
      count[s] = 0;
    }
    for (var j = 0; j < points.length; j++) {
      var label = labels[j];
      sum[label][0] += points[j][0];
      sum[label][1] += points[j][1];
      sum[label][2] += points[j][2];
      count[label]++;
    }

    for (var m = 0; m < k; m++) {
      if (count[m] === 0) {
        centers[m] = points[Math.floor(Math.random() * points.length)].slice();
      } else {
        centers[m] = [
          sum[m][0] / count[m],
          sum[m][1] / count[m],
          sum[m][2] / count[m]
        ];
      }
    }
    olabels = labels.slice();
    if (!changed && t > 1) {
      break;
    }
  }
  return {
    centers: centers,
    labels: labels,
    t: rt
  };
}
