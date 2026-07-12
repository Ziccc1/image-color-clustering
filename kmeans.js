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
    var distance = countDistance(point, centers[i]);
    if (distance < bdistance) {
      bdistance = distance;
      bindex = i;
    }
  }

  return bindex;
}
function makeRandomCenters(points, k) {
  var centers = [];
  var usedIndexes = [];
  while (centers.length < k) {
    var index = Math.floor(Math.random() * points.length);

    if (usedIndexes.indexOf(index) === -1) {
      usedIndexes.push(index);
      centers.push(points[index].slice());
    }
  }

  return centers;
}
function kMeans(points, k, mt) {
  if (!points || points.length === 0) {
    return {
      centers: [],
      labels: [],
      t: 0
    };
  }
  k = Math.max(1, Math.min(k, points.length));
  mt = mt || 35;
  var centers = makeRandomCenters(points, k);
  var labels = [];
  var olabel = [];
  var rt = 0;
  for (var t = 0; t < mt; t++) {
    rt = t + 1;
    var changed = false;
    for (var p = 0; p < points.length; p++) {
      var group = findNearestCenter(points[p], centers);
      labels[p] = group;
      if (olabel[p] !== group) {
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
    olabel = labels.slice();
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
