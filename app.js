var sourceCanvas = document.getElementById("sourceCanvas");
var clusterCanvas = document.getElementById("clusterCanvas");
var workCanvas = document.getElementById("workCanvas");
var imageInput = document.getElementById("imageInput");
var runBtn = document.getElementById("runBtn");
var kRange = document.getElementById("kRange");
var kText = document.getElementById("kText");
var kTextHeader = document.getElementById("kTextHeader");
var kTextPalette = document.getElementById("kTextPalette");
var qualitySelect = document.getElementById("qualitySelect");
var spaceSelect = document.getElementById("spaceSelect");
var spaceLabel = document.getElementById("spaceLabel");
var chartSelect = document.getElementById("chartSelect");
var imageMeta = document.getElementById("imageMeta");
var paletteBar = document.getElementById("paletteBar");
var chartBox = document.getElementById("chart");
var meanChartBox = document.getElementById("meanChart");
var meanChartSelect = document.getElementById("meanChartSelect");
var colorList = document.getElementById("colorList");
var reportBox = document.getElementById("reportBox");
var sampleCount = document.getElementById("sampleCount");
var iterationCount = document.getElementById("iterationCount");
var runTime = document.getElementById("runTime");
var exportJsonBtn = document.getElementById("exportJsonBtn");
var exportCsvBtn = document.getElementById("exportCsvBtn");
var aiAnalyzeBtn = document.getElementById("aiAnalyzeBtn");
var artworkTitle = document.getElementById("artworkTitle");
var reportMainColor = document.getElementById("reportMainColor");
var reportTone = document.getElementById("reportTone");
var chartNote = document.getElementById("chartNote");
var previewOriginalBtn = document.getElementById("previewOriginalBtn");
var previewClusterBtn = document.getElementById("previewClusterBtn");
var previewViews = document.querySelectorAll(".canvas-view");
var colorPrev = document.getElementById("colorPrev");
var colorNext = document.getElementById("colorNext");
var colorPager = document.getElementById("colorPager");
var colorAxis = document.getElementById("colorAxis");
var colorPage = 0;
var sampleData = window.PALETTE_SAMPLE_DATA || {};


var AI_CONFIG = {
  url: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  model: "qwen-plus",
  key: "sk-bd57c1a18f264f0880410fcabb2b6a6c"
};

var AI_ANALYSIS_PROMPT = [
  "你是一名色彩分析与信息可视化助手。",
  "请根据图片经过 K-means 聚类得到的主色、RGB 数值和像素占比，判断这组颜色的整体和谐度。",
  "请按以下顺序输出：1. 总体和谐度；2. 主色与辅助色关系；3. 冷暖关系；4. 明度与饱和度；5. 画面可能传达的情绪；6. 适合的设计应用场景。",
  "分析要基于给出的数据，不要虚构图片中不存在的内容；使用简洁、自然的中文，不要输出代码。"
].join("\n");

var sampleSources = {
  landscape: {
    src: sampleData.landscape || "assets/monet-water-lilies.jpg",
    title: "莫奈《睡莲》",
    artist: "Claude Monet"
  },
  poster: {
    src: sampleData.poster || "assets/van-gogh-almond-blossom.jpg",
    title: "梵高《盛开的杏花》",
    artist: "Vincent van Gogh"
  },
  food: {
    src: sampleData.food || "assets/hokusai-great-wave.png",
    title: "葛饰北斋《神奈川冲浪里》",
    artist: "Hokusai Katsushika"
  },
  chinese: {
    src: sampleData.chinese || "assets/chinese-landscape.jpg",
    title: "传统写意山水",
    artist: "东方水墨意象"
  }
};

var currentImage = null;
var currentImageName = "示例图片";
var lastResult = [];
var lastPoints = [];
var lastSpace = "rgb";
var chart = null;
var meanChart = null;
var sampleRequestId = 0;

function makeSampleImage(type) {
  var requestId = ++sampleRequestId;
  var sample = sampleSources[type];
  if (sample) {
    var realImage = new Image();
    realImage.onload = function () {
      if (requestId !== sampleRequestId) return;
      currentImage = realImage;
      currentImageName = sample.title;
      if (artworkTitle) {
        artworkTitle.textContent = sample.title;
        artworkTitle.nextElementSibling.textContent = sample.artist;
      }
      drawImagePreview();
      runCluster();
    };
    realImage.onerror = function () {
      if (requestId !== sampleRequestId) return;
      reportBox.textContent = "示例图片加载失败，请检查 assets 文件夹。";
    };
    realImage.src = sample.src;
    return;
  }

  var c = document.createElement("canvas");
  c.width = 900;
  c.height = 560;
  var ctx = c.getContext("2d");

  if (type === "landscape") {
    var sky = ctx.createLinearGradient(0, 0, 0, c.height);
    sky.addColorStop(0, "#86b6d8");
    sky.addColorStop(0.45, "#d8d7bd");
    sky.addColorStop(1, "#466b4a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#f0c86b";
    ctx.beginPath();
    ctx.arc(720, 120, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#667d59";
    ctx.beginPath();
    ctx.moveTo(0, 360);
    ctx.lineTo(190, 210);
    ctx.lineTo(390, 380);
    ctx.lineTo(580, 240);
    ctx.lineTo(900, 390);
    ctx.lineTo(900, 560);
    ctx.lineTo(0, 560);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#2e523e";
    ctx.beginPath();
    ctx.moveTo(0, 430);
    ctx.bezierCurveTo(210, 330, 420, 510, 900, 390);
    ctx.lineTo(900, 560);
    ctx.lineTo(0, 560);
    ctx.closePath();
    ctx.fill();
  } else if (type === "poster") {
    ctx.fillStyle = "#16212b";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#e85c41";
    ctx.fillRect(75, 80, 330, 360);
    ctx.fillStyle = "#f1c74d";
    ctx.fillRect(405, 80, 210, 360);
    ctx.fillStyle = "#2e8cb8";
    ctx.fillRect(615, 80, 210, 360);
    ctx.fillStyle = "#f7eee0";
    ctx.beginPath();
    ctx.arc(255, 280, 115, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#22394a";
    ctx.beginPath();
    ctx.arc(630, 250, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#b54d61";
    ctx.fillRect(140, 380, 610, 70);
  } else {
    var table = ctx.createLinearGradient(0, 0, c.width, c.height);
    table.addColorStop(0, "#ead7b0");
    table.addColorStop(1, "#a9744f");
    ctx.fillStyle = table;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#f5f0df";
    ctx.beginPath();
    ctx.ellipse(455, 285, 300, 200, -0.1, 0, Math.PI * 2);
    ctx.fill();
    var colors = ["#c93830", "#e88931", "#6f8f45", "#723d2e", "#f2c84b", "#9d2724"];
    for (var i = 0; i < 38; i++) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      var x = 220 + (i * 79) % 470;
      var y = 145 + (i * 47) % 250;
      ctx.ellipse(x, y, 42 + (i % 4) * 5, 34 + (i % 3) * 4, i, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  var img = new Image();
  img.onload = function () {
    if (requestId !== sampleRequestId) return;
    currentImage = img;
    currentImageName = artworkTitle ? artworkTitle.textContent : "示例图片-" + type;
    drawImagePreview();
    runCluster();
  };
  img.src = c.toDataURL("image/png");
}

function drawImagePreview() {
  if (!currentImage) return;
  drawImageToCanvas(currentImage, sourceCanvas, false, null);
  clearCanvas(clusterCanvas, "等待聚类");
  imageMeta.textContent = currentImageName + " · " + currentImage.naturalWidth + " x " + currentImage.naturalHeight;
}

function drawImageToCanvas(img, canvas, useCluster, centers) {
  var ctx = canvas.getContext("2d");
  var boxW = 520;
  var boxH = 320;
  var ratio = Math.min(boxW / img.naturalWidth, boxH / img.naturalHeight);
  var w = Math.round(img.naturalWidth * ratio);
  var h = Math.round(img.naturalHeight * ratio);
  var x = Math.floor((boxW - w) / 2);
  var y = Math.floor((boxH - h) / 2);
  canvas.width = boxW;
  canvas.height = boxH;
  ctx.clearRect(0, 0, boxW, boxH);
  ctx.fillStyle = "#ebece6";
  ctx.fillRect(0, 0, boxW, boxH);
  ctx.drawImage(img, x, y, w, h);

  if (useCluster && centers && centers.length > 0) {
    var imgData = ctx.getImageData(x, y, w, h);
    var data = imgData.data;
    for (var i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 10) continue;
      var rgb = [data[i], data[i + 1], data[i + 2]];
      var test = lastSpace === "lab" ? rgbToLab(rgb) : rgb;
      var best = findNearestCenter(test, centers);
      var color = centers[best].rgb;
      data[i] = color[0];
      data[i + 1] = color[1];
      data[i + 2] = color[2];
      data[i + 3] = 255;
    }
    ctx.putImageData(imgData, x, y);
  }
}

function clearCanvas(canvas, text) {
  var ctx = canvas.getContext("2d");
  canvas.width = 520;
  canvas.height = 320;
  ctx.fillStyle = "#ebece6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#667063";
  ctx.font = "16px Microsoft YaHei, Arial";
  ctx.textAlign = "center";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

function getSamplePoints(img, maxCount, space) {
  var maxSide = 420;
  var ratio = Math.min(1, maxSide / img.naturalWidth, maxSide / img.naturalHeight);
  var w = Math.max(1, Math.round(img.naturalWidth * ratio));
  var h = Math.max(1, Math.round(img.naturalHeight * ratio));
  workCanvas.width = w;
  workCanvas.height = h;
  var ctx = workCanvas.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  var data = ctx.getImageData(0, 0, w, h).data;
  var total = w * h;
  var step = Math.max(1, Math.floor(total / maxCount));
  var points = [];

  for (var i = 0; i < total; i += step) {
    var p = i * 4;
    if (data[p + 3] < 10) continue;
    var rgb = [data[p], data[p + 1], data[p + 2]];
    var value = space === "lab" ? rgbToLab(rgb) : [rgb[0], rgb[1], rgb[2]];
    points.push({ rgb: rgb, value: value });
  }
  return points;
}

function runCluster() {
  if (!currentImage) return;
  runBtn.disabled = true;
  runBtn.textContent = "计算中...";

  setTimeout(function () {
    var start = performance.now();
    var k = Number(kRange.value);
    var maxCount = Number(qualitySelect.value);
    var space = spaceSelect.value;
    lastSpace = space;
    var points = getSamplePoints(currentImage, maxCount, space);
    lastPoints = points;

    if (points.length < k) {
      reportBox.textContent = "图片像素太少，无法完成当前 K 值聚类。";
      runBtn.disabled = false;
      runBtn.textContent = "启动色彩聚类";
      return;
    }

    var values = [];
    for (var i = 0; i < points.length; i++) {
      values.push(points[i].value);
    }

    var km = kMeans(values, k, 35);
    var groups = [];
    for (var j = 0; j < k; j++) {
      groups.push({ center: km.centers[j], count: 0, rgbSum: [0, 0, 0] });
    }

    for (var a = 0; a < km.labels.length; a++) {
      var label = km.labels[a];
      groups[label].count++;
      groups[label].rgbSum[0] += points[a].rgb[0];
      groups[label].rgbSum[1] += points[a].rgb[1];
      groups[label].rgbSum[2] += points[a].rgb[2];
    }

    var result = [];
    for (var b = 0; b < groups.length; b++) {
      if (groups[b].count === 0) continue;
      var rgbMean = [
        Math.round(groups[b].rgbSum[0] / groups[b].count),
        Math.round(groups[b].rgbSum[1] / groups[b].count),
        Math.round(groups[b].rgbSum[2] / groups[b].count)
      ];
      var colorValue = space === "lab" ? rgbToLab(rgbMean) : rgbMean;
      result.push({
        name: "颜色 " + (result.length + 1),
        rgb: rgbMean,
        value: colorValue,
        hex: rgbToHex(rgbMean),
        count: groups[b].count,
        percent: groups[b].count / points.length * 100
      });
    }

    result.sort(function (x, y) {
      return y.count - x.count;
    });
    for (var c = 0; c < result.length; c++) {
      result[c].name = "颜色 " + (c + 1);
    }

    lastResult = result;
    var cost = Math.round(performance.now() - start);
    sampleCount.textContent = points.length.toLocaleString("zh-CN");
    if (iterationCount) iterationCount.textContent = km.times + " 次";
    runTime.textContent = cost + " ms";
    imageMeta.textContent = currentImageName + " · " + currentImage.naturalWidth + " x " + currentImage.naturalHeight + " · " + space.toUpperCase();
    if (spaceLabel) spaceLabel.textContent = space.toUpperCase() + " 聚类";
    if (kTextHeader) kTextHeader.textContent = k;
    if (kTextPalette) kTextPalette.textContent = k;
    reportMainColor.textContent = result[0].hex.toUpperCase();
    reportTone.textContent = describeColor(result[0].rgb).split(" · ")[0];

    drawImageToCanvas(currentImage, clusterCanvas, true, result);
    renderPalette(result);
    renderColorList(result);
    renderChart(result);
    renderMeanChart(result);
    reportBox.classList.remove("is-ai-report");
    reportBox.innerHTML = makeLocalReport(result, points.length, space, k);
    runBtn.disabled = false;
    runBtn.textContent = "启动色彩聚类";
  }, 30);
}

// 这里的 K-means 特意写得直接一点，方便看出每一步在做什么。
function kMeans(points, k, maxTimes) {
  var centers = [];
  var labels = [];
  var oldLabels = [];

  for (var i = 0; i < k; i++) {
    var index = Math.floor(i * points.length / k);
    centers.push(points[index].slice());
  }

  var realTimes = 0;
  for (var times = 0; times < maxTimes; times++) {
    realTimes = times + 1;
    var changed = false;

    for (var p = 0; p < points.length; p++) {
      var bestIndex = 0;
      var bestDistance = countDistance(points[p], centers[0]);
      for (var c = 1; c < centers.length; c++) {
        var d = countDistance(points[p], centers[c]);
        if (d < bestDistance) {
          bestDistance = d;
          bestIndex = c;
        }
      }
      labels[p] = bestIndex;
      if (oldLabels[p] !== bestIndex) {
        changed = true;
      }
    }

    var sums = [];
    var nums = [];
    for (var s = 0; s < k; s++) {
      sums[s] = [0, 0, 0];
      nums[s] = 0;
    }

    for (var j = 0; j < points.length; j++) {
      var group = labels[j];
      sums[group][0] += points[j][0];
      sums[group][1] += points[j][1];
      sums[group][2] += points[j][2];
      nums[group]++;
    }

    for (var m = 0; m < k; m++) {
      if (nums[m] === 0) {
        centers[m] = points[Math.floor(Math.random() * points.length)].slice();
      } else {
        centers[m] = [
          sums[m][0] / nums[m],
          sums[m][1] / nums[m],
          sums[m][2] / nums[m]
        ];
      }
    }

    oldLabels = labels.slice();
    if (!changed && times > 1) {
      break;
    }
  }

  return { centers: centers, labels: labels, times: realTimes };
}

function countDistance(a, b) {
  var x = a[0] - b[0];
  var y = a[1] - b[1];
  var z = a[2] - b[2];
  return x * x + y * y + z * z;
}

function findNearestCenter(value, centers) {
  var best = 0;
  var bestDis = countDistance(value, centers[0].value);
  for (var i = 1; i < centers.length; i++) {
    var dis = countDistance(value, centers[i].value);
    if (dis < bestDis) {
      bestDis = dis;
      best = i;
    }
  }
  return best;
}

function renderPalette(result) {
  paletteBar.innerHTML = "";
  for (var i = 0; i < result.length; i++) {
    var seg = document.createElement("div");
    seg.className = "palette-segment";
    seg.style.background = result[i].hex;
    seg.style.flex = Math.max(result[i].percent, 3) + " 1 0";
    seg.textContent = result[i].percent >= 7 ? result[i].percent.toFixed(1) + "%" : "";
    seg.setAttribute("aria-label", result[i].name + " " + result[i].hex + " " + result[i].percent.toFixed(1) + "%");
    paletteBar.appendChild(seg);
  }
}

function renderColorList(result) {
  colorList.innerHTML = "";
  colorAxis.innerHTML = "";
  var pageSize = 4;
  var pageCount = Math.max(1, Math.ceil(result.length / pageSize));

  for (var pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    var page = document.createElement("div");
    page.className = "color-page";
    var start = pageIndex * pageSize;
    var end = Math.min(start + pageSize, result.length);

    for (var i = start; i < end; i++) {
      var item = document.createElement("article");
      item.className = "color-item";
      var type = describeColor(result[i].rgb);
      item.innerHTML =
        '<div class="swatch" style="background:' + result[i].hex + '"></div>' +
        '<div class="color-info">' +
        '<strong>颜色 ' + (i + 1) + '</strong>' +
        '<p>十六进制：' + result[i].hex.toUpperCase() + "</p>" +
        '<p>像素数：' + result[i].count.toLocaleString("zh-CN") + "</p>" +
        '<p class="color-percent">占比：' + result[i].percent.toFixed(1) + "%</p>" +
        '<p>' + type + "</p>" +
        "</div>";
      page.appendChild(item);
    }
    colorList.appendChild(page);
  }

  for (var axisIndex = 0; axisIndex < result.length; axisIndex++) {
    var axisSegment = document.createElement("span");
    axisSegment.className = "axis-segment";
    axisSegment.style.background = result[axisIndex].hex;
    axisSegment.style.flex = Math.max(result[axisIndex].percent, 3) + " 1 0";
    axisSegment.setAttribute("aria-label", "颜色 " + (axisIndex + 1) + " " + result[axisIndex].hex);
    colorAxis.appendChild(axisSegment);
  }
  colorPage = 0;
  updateColorCarousel();
}

function updateColorCarousel() {
  var pages = colorList.querySelectorAll(".color-page");
  var pageCount = Math.max(1, pages.length);
  colorPage = Math.max(0, Math.min(colorPage, pageCount - 1));
  var viewportHeight = colorList.parentElement.clientHeight;
  colorList.style.transform = "translateY(-" + colorPage * viewportHeight + "px)";
  colorPager.textContent = (colorPage + 1) + " / " + pageCount;
  colorPrev.disabled = colorPage === 0;
  colorNext.disabled = colorPage === pageCount - 1;

}

function renderChart(result) {
  if (!window.echarts) {
    renderFallbackChart(result);
    return;
  }
  if (!chart) {
    chart = echarts.init(chartBox);
  }
  var type = chartSelect.value;
  var option;
  var tooltipFormatter = function (p) {
    var d = result[p.dataIndex];
    return d.name + "<br>" + d.hex + "<br>RGB(" + d.rgb.join(", ") + ")<br>像素：" + d.count.toLocaleString("zh-CN") + "<br>占比：" + d.percent.toFixed(1) + "%";
  };
  var tooltipStyle = {
    backgroundColor: "rgba(254, 251, 244, 0.96)",
    borderColor: "#d8cbb4",
    borderWidth: 1,
    textStyle: { color: "#3c342c" }
  };
  if (type === "bar") {
    option = {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: function (params) {
          return tooltipFormatter(params[0]);
        },
        backgroundColor: tooltipStyle.backgroundColor,
        borderColor: tooltipStyle.borderColor,
        borderWidth: tooltipStyle.borderWidth,
        textStyle: tooltipStyle.textStyle
      },
      grid: { left: 58, right: 24, top: 36, bottom: 58 },
      xAxis: {
        type: "category",
        data: result.map(function (d) { return d.name; }),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#d8cbb4" } },
        axisLabel: { color: "#7a6e61" }
      },
      yAxis: {
        type: "value",
        name: "像素数量",
        splitLine: { lineStyle: { color: "rgba(138, 121, 96, 0.14)", type: "dashed" } },
        axisLabel: { color: "#7a6e61" }
      },
      series: [{
        type: "bar",
        data: result.map(function (d) { return d.count; }),
        barWidth: "54%",
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: function (p) {
            return result[p.dataIndex].hex;
          }
        },
        label: {
          show: true,
          position: "top",
          formatter: function (p) {
            return result[p.dataIndex].count.toLocaleString("zh-CN") + "\n" + result[p.dataIndex].percent.toFixed(1) + "%";
          }
        }
      }]
    };
  } else if (type === "treemap") {
    option = {
      tooltip: {
        trigger: "item",
        formatter: tooltipFormatter,
        backgroundColor: tooltipStyle.backgroundColor,
        borderColor: tooltipStyle.borderColor,
        borderWidth: tooltipStyle.borderWidth,
        textStyle: tooltipStyle.textStyle
      },
      series: [{
        name: "颜色面积树图",
        type: "treemap",
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        top: 22,
        left: 20,
        right: 20,
        bottom: 20,
        label: {
          show: true,
          formatter: function (p) {
            var d = result[p.dataIndex];
            return d.name + "\n" + d.percent.toFixed(1) + "%";
          },
          color: "rgba(41, 35, 28, 0.78)",
          fontWeight: 700
        },
        itemStyle: {
          borderColor: "#fdf9ef",
          borderWidth: 4,
          gapWidth: 4,
          borderRadius: 8
        },
        data: result.map(function (d) {
          return {
            name: d.name,
            value: d.count,
            itemStyle: { color: d.hex }
          };
        })
      }]
    };
  } else {
    option = {
      tooltip: {
        trigger: "item",
        formatter: tooltipFormatter,
        backgroundColor: tooltipStyle.backgroundColor,
        borderColor: tooltipStyle.borderColor,
        borderWidth: tooltipStyle.borderWidth,
        textStyle: tooltipStyle.textStyle
      },
      legend: {
        bottom: 6,
        type: "scroll",
        textStyle: { color: "#6f6458" }
      },
      series: [{
        name: "颜色类簇",
        type: "pie",
        radius: type === "donut" ? ["42%", "68%"] : "68%",
        roseType: type === "rose" ? "radius" : false,
        center: ["50%", "43%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderColor: "#fdf9ef",
          borderWidth: 2,
          borderRadius: 5
        },
        label: {
          formatter: "{b}\n{d}%",
          color: "#5f554b"
        },
        labelLine: { lineStyle: { color: "rgba(112, 96, 74, 0.35)" } },
        data: result.map(function (d) {
          return {
            name: d.name,
            value: d.count,
            itemStyle: { color: d.hex }
          };
        })
      }]
    };
  }
  chart.setOption(option, true);
}

function renderMeanChart(result) {
  var type = meanChartSelect.value;
  if (!window.echarts) {
    renderMeanFallback(result, type);
    return;
  }
  if (!meanChart) {
    meanChart = echarts.init(meanChartBox);
  }

  var tooltipFormatter = function (params) {
    var index = params && params.length ? params[0].dataIndex : 0;
    var item = result[index];
    return item.name + "<br>平均色：" + item.hex.toUpperCase() +
      "<br>RGB(" + item.rgb.join(", ") + ")" +
      "<br>像素：" + item.count.toLocaleString("zh-CN") +
      "<br>占比：" + item.percent.toFixed(1) + "%";
  };

  var baseOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: tooltipFormatter,
      backgroundColor: "rgba(254, 251, 244, 0.96)",
      borderColor: "#d8cbb4",
      borderWidth: 1,
      textStyle: { color: "#3c342c" }
    }
  };

  var option;
  if (type === "heatmap") {
    option = Object.assign({}, baseOption, {
      tooltip: {
        trigger: "item",
        formatter: function (params) {
          var channel = ["R", "G", "B"][params.value[0]];
          var item = result[params.value[1]];
          return item.name + "<br>" + channel + " 均值：" + params.value[2] +
            "<br>平均色：" + item.hex.toUpperCase() +
            "<br>像素：" + item.count.toLocaleString("zh-CN") +
            "<br>占比：" + item.percent.toFixed(1) + "%";
        },
        backgroundColor: "rgba(254, 251, 244, 0.96)",
        borderColor: "#d8cbb4",
        borderWidth: 1,
        textStyle: { color: "#3c342c" }
      },
      grid: { left: 62, right: 16, top: 18, bottom: 44 },
      xAxis: {
        type: "category",
        data: ["R", "G", "B"],
        splitArea: { show: true },
        axisLine: { lineStyle: { color: "#d8d2ca" } },
        axisLabel: { color: "#827a72" }
      },
      yAxis: {
        type: "category",
        data: result.map(function (d) { return d.name; }),
        axisLine: { lineStyle: { color: "#d8d2ca" } },
        axisLabel: { color: "#827a72", fontSize: 11 }
      },
      visualMap: {
        min: 0,
        max: 255,
        calculable: false,
        orient: "horizontal",
        left: "center",
        bottom: 0,
        itemWidth: 110,
        itemHeight: 8,
        textStyle: { color: "#827a72", fontSize: 10 },
        inRange: { color: ["#eef0f0", "#b8c7d1", "#7899bd", "#405c79"] }
      },
      series: [{
        name: "RGB 均值",
        type: "heatmap",
        label: { show: true, color: "#4d4944", fontSize: 11 },
        data: result.reduce(function (all, d, index) {
          all.push([0, index, d.rgb[0]], [1, index, d.rgb[1]], [2, index, d.rgb[2]]);
          return all;
        }, []),
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: "rgba(60, 54, 47, .22)" } }
      }]
    });
  } else if (type === "radar") {
    option = Object.assign({}, baseOption, {
      tooltip: {
        trigger: "item",
        formatter: function (params) {
          var item = result[params.seriesIndex];
          return item.name + "<br>平均色：" + item.hex.toUpperCase() +
            "<br>RGB(" + item.rgb.join(", ") + ")" +
            "<br>像素：" + item.count.toLocaleString("zh-CN") +
            "<br>占比：" + item.percent.toFixed(1) + "%";
        },
        backgroundColor: "rgba(254, 251, 244, 0.96)",
        borderColor: "#d8cbb4",
        borderWidth: 1,
        textStyle: { color: "#3c342c" }
      },
      legend: {
        bottom: 0,
        type: "scroll",
        textStyle: { color: "#77716a", fontSize: 10 },
        data: result.map(function (d) { return d.name; })
      },
      radar: {
        center: ["50%", "47%"],
        radius: "65%",
        indicator: [{ name: "R", max: 255 }, { name: "G", max: 255 }, { name: "B", max: 255 }],
        axisName: { color: "#77716a", fontSize: 11 },
        splitLine: { lineStyle: { color: ["#e5e0da", "#ddd7cf", "#d2cbc2"] } },
        splitArea: { areaStyle: { color: ["rgba(255,255,255,.6)", "rgba(242,239,234,.5)"] } },
        axisLine: { lineStyle: { color: "#d8d2ca" } }
      },
      series: result.map(function (d) {
        return {
          name: d.name,
          type: "radar",
          symbol: "circle",
          symbolSize: 4,
          lineStyle: { width: 2, color: d.hex },
          itemStyle: { color: d.hex },
          areaStyle: { color: d.hex, opacity: 0.045 },
          data: [{ value: d.rgb, name: d.name }]
        };
      })
    });
  } else {
    option = Object.assign({}, baseOption, {
    legend: {
      top: 0,
      right: 0,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: { color: "#77716a", fontSize: 11 },
      data: ["R 均值", "G 均值", "B 均值"]
    },
    grid: { left: 48, right: 12, top: 34, bottom: 44 },
    xAxis: {
      type: "category",
      data: result.map(function (d) { return d.name; }),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#d8d2ca" } },
      axisLabel: { color: "#827a72", fontSize: 11 }
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 255,
      interval: 85,
      name: "均值",
      nameTextStyle: { color: "#aaa39b", fontSize: 11 },
      splitLine: { lineStyle: { color: "rgba(138, 121, 96, 0.12)" } },
      axisLabel: { color: "#827a72", fontSize: 10 }
    },
    series: [
      {
        name: "R 均值",
        type: "bar",
        barMaxWidth: 12,
        itemStyle: { color: "#c9796a", borderRadius: [4, 4, 0, 0] },
        data: result.map(function (d) { return d.rgb[0]; })
      },
      {
        name: "G 均值",
        type: "bar",
        barMaxWidth: 12,
        itemStyle: { color: "#84a27a", borderRadius: [4, 4, 0, 0] },
        data: result.map(function (d) { return d.rgb[1]; })
      },
      {
        name: "B 均值",
        type: "bar",
        barMaxWidth: 12,
        itemStyle: { color: "#7899bd", borderRadius: [4, 4, 0, 0] },
        data: result.map(function (d) { return d.rgb[2]; })
      }
    ]
    });
  }
  meanChart.setOption(option, true);
}

function renderMeanFallback(result, type) {
  meanChartBox.innerHTML = "";
  var wrap = document.createElement("div");
  wrap.className = "mean-fallback";
  if (type === "heatmap") wrap.classList.add("mean-fallback-heatmap");
  if (type === "radar") wrap.classList.add("mean-fallback-radar");
  for (var i = 0; i < result.length; i++) {
    var row = document.createElement("div");
    row.className = "mean-fallback-row";
    var label = document.createElement("span");
    label.className = "mean-fallback-label";
    label.textContent = result[i].name;
    var bars = document.createElement("div");
    bars.className = "mean-fallback-bars";
    var colors = ["#c9796a", "#84a27a", "#7899bd"];
    var letters = ["R", "G", "B"];
    for (var j = 0; j < 3; j++) {
      var bar = document.createElement("div");
      bar.className = "mean-fallback-bar";
      var fill = document.createElement("span");
      fill.style.width = result[i].rgb[j] / 255 * 100 + "%";
      fill.style.background = colors[j];
      var value = document.createElement("em");
      value.textContent = letters[j] + " " + result[i].rgb[j];
      bar.appendChild(fill);
      bar.appendChild(value);
      bars.appendChild(bar);
    }
    row.appendChild(label);
    row.appendChild(bars);
    wrap.appendChild(row);
  }
  meanChartBox.appendChild(wrap);
}

function renderFallbackChart(result) {
  chartBox.innerHTML = "";
  var type = chartSelect.value;
  var svgNS = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 800 380");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "备用 SVG 聚类图表");
  svg.style.width = "100%";
  svg.style.height = "100%";

  var title = document.createElementNS(svgNS, "text");
  title.setAttribute("x", "28");
  title.setAttribute("y", "34");
  title.setAttribute("fill", "#667063");
  title.setAttribute("font-size", "14");
  title.textContent = "聚类颜色数量分布";
  svg.appendChild(title);

  if (type === "bar") {
    drawFallbackBar(svg, result);
  } else if (type === "treemap") {
    drawFallbackTreemap(svg, result);
  } else {
    drawFallbackPie(svg, result, type === "donut", type === "rose");
  }
  chartBox.appendChild(svg);
}

function drawFallbackBar(svg, result) {
  var svgNS = "http://www.w3.org/2000/svg";
  var left = 60;
  var top = 70;
  var width = 690;
  var height = 230;
  var max = 1;
  for (var i = 0; i < result.length; i++) {
    max = Math.max(max, result[i].count);
  }

  var axis = document.createElementNS(svgNS, "path");
  axis.setAttribute("d", "M" + left + " " + top + "V" + (top + height) + "H" + (left + width));
  axis.setAttribute("fill", "none");
  axis.setAttribute("stroke", "#b8beb4");
  svg.appendChild(axis);

  var gap = 16;
  var barW = (width - gap * (result.length + 1)) / result.length;
  for (var j = 0; j < result.length; j++) {
    var h = result[j].count / max * height;
    var x = left + gap + j * (barW + gap);
    var y = top + height - h;
    var rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", barW);
    rect.setAttribute("height", h);
    rect.setAttribute("rx", "6");
    rect.setAttribute("fill", result[j].hex);
    svg.appendChild(rect);

    var label = document.createElementNS(svgNS, "text");
    label.setAttribute("x", x + barW / 2);
    label.setAttribute("y", y - 8);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("fill", "#1e2620");
    label.setAttribute("font-size", "13");
    label.textContent = result[j].percent.toFixed(1) + "%";
    svg.appendChild(label);

    var name = document.createElementNS(svgNS, "text");
    name.setAttribute("x", x + barW / 2);
    name.setAttribute("y", top + height + 26);
    name.setAttribute("text-anchor", "middle");
    name.setAttribute("fill", "#667063");
    name.setAttribute("font-size", "12");
    name.textContent = result[j].name;
    svg.appendChild(name);
  }
}

function drawFallbackTreemap(svg, result) {
  var svgNS = "http://www.w3.org/2000/svg";
  var x = 70;
  var y = 76;
  var width = 470;
  var height = 230;
  var total = 0;
  for (var i = 0; i < result.length; i++) total += result[i].count;
  var nowX = x;

  for (var j = 0; j < result.length; j++) {
    var w = result[j].count / total * width;
    var rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", nowX);
    rect.setAttribute("y", y);
    rect.setAttribute("width", Math.max(w - 4, 8));
    rect.setAttribute("height", height);
    rect.setAttribute("rx", "8");
    rect.setAttribute("fill", result[j].hex);
    rect.setAttribute("stroke", "#fdf9ef");
    rect.setAttribute("stroke-width", "3");
    svg.appendChild(rect);

    if (w > 60) {
      var label = document.createElementNS(svgNS, "text");
      label.setAttribute("x", nowX + w / 2);
      label.setAttribute("y", y + height / 2 - 6);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("fill", "#2e2a24");
      label.setAttribute("font-size", "13");
      label.setAttribute("font-weight", "700");
      label.textContent = result[j].name;
      svg.appendChild(label);

      var percent = document.createElementNS(svgNS, "text");
      percent.setAttribute("x", nowX + w / 2);
      percent.setAttribute("y", y + height / 2 + 16);
      percent.setAttribute("text-anchor", "middle");
      percent.setAttribute("fill", "#2e2a24");
      percent.setAttribute("font-size", "12");
      percent.textContent = result[j].percent.toFixed(1) + "%";
      svg.appendChild(percent);
    }
    nowX += w;
  }

  for (var k = 0; k < result.length; k++) {
    var ly = 92 + k * 42;
    var sw = document.createElementNS(svgNS, "rect");
    sw.setAttribute("x", "590");
    sw.setAttribute("y", ly - 16);
    sw.setAttribute("width", "24");
    sw.setAttribute("height", "24");
    sw.setAttribute("rx", "5");
    sw.setAttribute("fill", result[k].hex);
    svg.appendChild(sw);

    var text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", "626");
    text.setAttribute("y", ly + 1);
    text.setAttribute("fill", "#3c342c");
    text.setAttribute("font-size", "13");
    text.textContent = result[k].name + "  " + result[k].percent.toFixed(1) + "%";
    svg.appendChild(text);
  }
}

function drawFallbackPie(svg, result, donut, rose) {
  var svgNS = "http://www.w3.org/2000/svg";
  var cx = 310;
  var cy = 182;
  var r = 115;
  var max = 1;
  var total = 0;
  for (var i = 0; i < result.length; i++) {
    total += result[i].count;
    max = Math.max(max, result[i].count);
  }
  var start = -90;

  for (var j = 0; j < result.length; j++) {
    var angle = result[j].count / total * 360;
    var path = document.createElementNS(svgNS, "path");
    var currentR = rose ? 58 + result[j].count / max * 88 : r;
    path.setAttribute("d", makeArcPath(cx, cy, currentR, start, start + angle, donut ? 58 : 0));
    path.setAttribute("fill", result[j].hex);
    path.setAttribute("stroke", "#ffffff");
    path.setAttribute("stroke-width", "2");
    svg.appendChild(path);
    start += angle;
  }

  if (donut) {
    var centerText = document.createElementNS(svgNS, "text");
    centerText.setAttribute("x", cx);
    centerText.setAttribute("y", cy - 4);
    centerText.setAttribute("text-anchor", "middle");
    centerText.setAttribute("fill", "#1e2620");
    centerText.setAttribute("font-size", "20");
    centerText.textContent = "K = " + result.length;
    svg.appendChild(centerText);
    var sub = document.createElementNS(svgNS, "text");
    sub.setAttribute("x", cx);
    sub.setAttribute("y", cy + 20);
    sub.setAttribute("text-anchor", "middle");
    sub.setAttribute("fill", "#667063");
    sub.setAttribute("font-size", "12");
    sub.textContent = "颜色类簇";
    svg.appendChild(sub);
  }

  for (var k = 0; k < result.length; k++) {
    var y = 92 + k * 42;
    var sw = document.createElementNS(svgNS, "rect");
    sw.setAttribute("x", "500");
    sw.setAttribute("y", y - 16);
    sw.setAttribute("width", "24");
    sw.setAttribute("height", "24");
    sw.setAttribute("rx", "5");
    sw.setAttribute("fill", result[k].hex);
    svg.appendChild(sw);

    var text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", "536");
    text.setAttribute("y", y + 1);
    text.setAttribute("fill", "#1e2620");
    text.setAttribute("font-size", "14");
    text.textContent = result[k].name + "  " + result[k].percent.toFixed(1) + "%  " + result[k].hex;
    svg.appendChild(text);
  }
}

function makeArcPath(cx, cy, r, startAngle, endAngle, innerR) {
  var start = angleToPoint(cx, cy, r, endAngle);
  var end = angleToPoint(cx, cy, r, startAngle);
  var large = endAngle - startAngle <= 180 ? 0 : 1;
  if (!innerR) {
    return [
      "M", cx, cy,
      "L", start.x, start.y,
      "A", r, r, 0, large, 0, end.x, end.y,
      "Z"
    ].join(" ");
  }
  var innerStart = angleToPoint(cx, cy, innerR, startAngle);
  var innerEnd = angleToPoint(cx, cy, innerR, endAngle);
  return [
    "M", start.x, start.y,
    "A", r, r, 0, large, 0, end.x, end.y,
    "L", innerStart.x, innerStart.y,
    "A", innerR, innerR, 0, large, 1, innerEnd.x, innerEnd.y,
    "Z"
  ].join(" ");
}

function angleToPoint(cx, cy, r, angle) {
  var a = (angle - 90) * Math.PI / 180;
  return {
    x: cx + r * Math.cos(a),
    y: cy + r * Math.sin(a)
  };
}

function makeLocalReport(result, pointCount, space, k) {
  if (!result.length) return "暂无结果。";
  var main = result[0];
  var hslList = [];
  var weightedLight = 0;
  var weightedSat = 0;
  for (var i = 0; i < result.length; i++) {
    var hsl = rgbToHsl(result[i].rgb);
    hslList.push(hsl);
    weightedLight += hsl.l * result[i].percent / 100;
    weightedSat += hsl.s * result[i].percent / 100;
  }

  var warm = 0;
  var cool = 0;
  var neutral = 0;
  for (var j = 0; j < result.length; j++) {
    var hue = hslList[j].h;
    if (hslList[j].s < 0.18) {
      neutral += result[j].percent;
    } else if (hue < 70 || hue > 330 || (hue > 250 && hue < 330)) {
      warm += result[j].percent;
    } else {
      cool += result[j].percent;
    }
  }

  var hueSpan = getHueSpan(hslList, result);
  var harmony = "色相比较分散，画面有较强的跳跃感";
  if (hueSpan < 35) {
    harmony = "主色接近，属于类似色搭配，整体比较统一";
  } else if (hueSpan < 95) {
    harmony = "色相有一定变化，但仍然保持在容易协调的范围内";
  } else if (hasComplement(hslList, result)) {
    harmony = "存在接近互补色的关系，对比明显，适合形成视觉重点";
  }

  var lightText = weightedLight > 0.68 ? "整体偏亮" : weightedLight < 0.34 ? "整体偏暗" : "明暗适中";
  var satText = weightedSat > 0.62 ? "饱和度较高" : weightedSat < 0.28 ? "色彩较柔和" : "饱和度中等";
  var tempText = "中性色占比较多";
  if (warm > cool && warm > neutral) tempText = "整体偏暖色";
  if (cool > warm && cool > neutral) tempText = "整体偏冷色";

  return "本次在 " + space.toUpperCase() + " 颜色空间中取 K = " + k + "，实际采样 " + pointCount.toLocaleString("zh-CN") +
    " 个像素。主色是 <strong>" + main.hex + "</strong>，占比 " + main.percent.toFixed(1) +
    "%，说明图片有比较明确的视觉中心。<br>" +
    "从颜色关系看，" + harmony + "；从明度和饱和度看，" + lightText + "，" + satText +
    "。综合判断：这组颜色" + (hueSpan < 110 || hasComplement(hslList, result) ? "比较和谐" : "有一定冲突感") +
    "，" + tempText + "，适合用作图片主色提取和配色参考。";
}

async function runAiAnalyze() {
  if (!lastResult.length) {
    reportBox.textContent = "请先完成一次聚类。";
    return;
  }
  var url = AI_CONFIG.url.trim();
  var key = AI_CONFIG.key.trim();
  var model = AI_CONFIG.model.trim() || "qwen-plus";
  if (!url || !key) {
    reportBox.classList.remove("is-ai-report");
    reportBox.innerHTML = "尚未填写源码中的 AI_CONFIG.key，当前显示本地分析。<br>" + makeLocalReport(lastResult, lastPoints.length, lastSpace, Number(kRange.value));
    return;
  }

  aiAnalyzeBtn.disabled = true;
  aiAnalyzeBtn.textContent = "分析中...";
  var colors = lastResult.map(function (d) {
    return d.name + " " + d.hex + " RGB(" + d.rgb.join(",") + ") 占比" + d.percent.toFixed(1) + "%";
  }).join("；");

  try {
    var res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + key
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: AI_ANALYSIS_PROMPT },
          { role: "user", content: "图片的 K-means 聚类结果如下：" + colors + "。请按照系统要求完成色彩分析。" }
        ],
        temperature: 0.4
      })
    });
    var data = await res.json();
    if (!res.ok) {
      var apiMessage = data.message || data.code || "HTTP " + res.status;
      if (data.error) {
        apiMessage = typeof data.error === "string" ? data.error : (data.error.message || data.error.code || apiMessage);
      }
      throw new Error(apiMessage);
    }

    var text = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "";
    if (!text && data.output && data.output.text) text = data.output.text;
    if (Array.isArray(text)) {
      text = text.map(function (item) {
        return typeof item === "string" ? item : (item.text || "");
      }).join("");
    }
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("接口返回中没有可用的分析文本");
    }
    reportBox.classList.add("is-ai-report");
    reportBox.innerHTML = formatAiReport(text);
  } catch (err) {
    reportBox.classList.remove("is-ai-report");
    reportBox.innerHTML = "AI 接口调用失败：" + escapeHtml(err.message || "未知错误") + "<br>已保留本地分析。<br>" + makeLocalReport(lastResult, lastPoints.length, lastSpace, Number(kRange.value));
  }
  aiAnalyzeBtn.disabled = false;
  aiAnalyzeBtn.textContent = "生成 AI 分析";
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatAiReport(text) {
  var clean = String(text || "").replace(/\r/g, "").trim();
  var blocks = clean.split(/(?=\d+\.\s*\*\*)/).filter(function (part) {
    return part.trim();
  });
  var items = [];

  for (var i = 0; i < blocks.length; i++) {
    var match = blocks[i].match(/^\s*(\d+)\.\s*\*\*(.+?)\*\*\s*[:：]?\s*([\s\S]*)$/);
    if (!match) continue;
    items.push({
      number: match[1],
      title: match[2].trim(),
      body: match[3].trim()
    });
  }

  if (!items.length) {
    return '<p class="ai-report-fallback">' + escapeHtml(clean).replace(/\n/g, "<br>") + "</p>";
  }

  var html = '<ol class="ai-report-list">';
  for (var j = 0; j < items.length; j++) {
    html += '<li>' +
      '<span class="ai-report-number">' + escapeHtml(items[j].number) + '</span>' +
      '<div class="ai-report-content">' +
      '<strong>' + escapeHtml(items[j].title) + '</strong>' +
      '<p>' + escapeHtml(items[j].body).replace(/\n/g, "<br>") + '</p>' +
      '</div>' +
      '</li>';
  }
  return html + "</ol>";
}

function describeColor(rgb) {
  var hsl = rgbToHsl(rgb);
  var temp = "中性色";
  if (hsl.s >= 0.18) {
    temp = (hsl.h < 70 || hsl.h > 330 || (hsl.h > 250 && hsl.h < 330)) ? "暖色" : "冷色";
  }
  var light = hsl.l > 0.68 ? "高亮" : hsl.l < 0.34 ? "低亮" : "中亮";
  var sat = hsl.s > 0.62 ? "高饱和" : hsl.s < 0.28 ? "低饱和" : "中饱和";
  return temp + " · " + light + " · " + sat;
}

function rgbToHex(rgb) {
  var str = "#";
  for (var i = 0; i < 3; i++) {
    var h = Math.max(0, Math.min(255, Math.round(rgb[i]))).toString(16);
    if (h.length < 2) h = "0" + h;
    str += h;
  }
  return str;
}

function rgbToHsl(rgb) {
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255;
  var max = Math.max(r, g, b);
  var min = Math.min(r, g, b);
  var h = 0;
  var s = 0;
  var l = (max + min) / 2;
  if (max !== min) {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    if (max === g) h = (b - r) / d + 2;
    if (max === b) h = (r - g) / d + 4;
    h = h * 60;
  }
  return { h: h, s: s, l: l };
}

function getHueSpan(hslList, result) {
  var hues = [];
  for (var i = 0; i < hslList.length; i++) {
    if (hslList[i].s > 0.18 && result[i].percent > 3) {
      hues.push(hslList[i].h);
    }
  }
  if (hues.length < 2) return 0;
  hues.sort(function (a, b) { return a - b; });
  var biggestGap = 0;
  for (var j = 0; j < hues.length; j++) {
    var next = j === hues.length - 1 ? hues[0] + 360 : hues[j + 1];
    biggestGap = Math.max(biggestGap, next - hues[j]);
  }
  return 360 - biggestGap;
}

function hasComplement(hslList, result) {
  for (var i = 0; i < hslList.length; i++) {
    for (var j = i + 1; j < hslList.length; j++) {
      if (result[i].percent < 5 || result[j].percent < 5) continue;
      var d = Math.abs(hslList[i].h - hslList[j].h);
      d = Math.min(d, 360 - d);
      if (d > 145 && d < 215) return true;
    }
  }
  return false;
}

function rgbToLab(rgb) {
  var xyz = rgbToXyz(rgb);
  return xyzToLab(xyz);
}

function rgbToXyz(rgb) {
  var r = pivotRgb(rgb[0] / 255);
  var g = pivotRgb(rgb[1] / 255);
  var b = pivotRgb(rgb[2] / 255);
  var x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  var y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  var z = r * 0.0193 + g * 0.1192 + b * 0.9505;
  return [x * 100, y * 100, z * 100];
}

function pivotRgb(n) {
  return n > 0.04045 ? Math.pow((n + 0.055) / 1.055, 2.4) : n / 12.92;
}

function xyzToLab(xyz) {
  var x = pivotXyz(xyz[0] / 95.047);
  var y = pivotXyz(xyz[1] / 100.0);
  var z = pivotXyz(xyz[2] / 108.883);
  return [
    116 * y - 16,
    500 * (x - y),
    200 * (y - z)
  ];
}

function pivotXyz(n) {
  return n > 0.008856 ? Math.pow(n, 1 / 3) : 7.787 * n + 16 / 116;
}

function downloadFile(name, content, type) {
  if (!lastResult.length) return;
  var blob = new Blob([content], { type: type });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportJson() {
  var data = JSON.stringify(lastResult.map(function (d) {
    return { name: d.name, hex: d.hex, rgb: d.rgb, count: d.count, percent: Number(d.percent.toFixed(2)) };
  }), null, 2);
  downloadFile("color-clusters.json", data, "application/json;charset=utf-8");
}

function exportCsv() {
  var lines = ["name,hex,r,g,b,count,percent"];
  for (var i = 0; i < lastResult.length; i++) {
    var d = lastResult[i];
    lines.push([d.name, d.hex, d.rgb[0], d.rgb[1], d.rgb[2], d.count, d.percent.toFixed(2)].join(","));
  }
  downloadFile("color-clusters.csv", lines.join("\n"), "text/csv;charset=utf-8");
}

imageInput.addEventListener("change", function (e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function () {
    var img = new Image();
    img.onload = function () {
      currentImage = img;
      currentImageName = file.name;
      drawImagePreview();
      runCluster();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

document.getElementById("sampleButtons").addEventListener("click", function (e) {
  var button = e.target.closest("button[data-sample]");
  if (button) {
    var buttons = document.querySelectorAll("button[data-sample]");
    for (var i = 0; i < buttons.length; i++) buttons[i].classList.remove("is-selected");
    button.classList.add("is-selected");
    if (artworkTitle) {
      artworkTitle.textContent = button.getAttribute("data-title") || "示例图像";
      artworkTitle.nextElementSibling.textContent = button.getAttribute("data-artist") || "Digital Atelier";
    }
    makeSampleImage(button.getAttribute("data-sample"));
  }
});

kRange.addEventListener("input", function () {
  kText.textContent = kRange.value;
  if (kTextHeader) kTextHeader.textContent = kRange.value;
  if (kTextPalette) kTextPalette.textContent = kRange.value;
});

runBtn.addEventListener("click", runCluster);
qualitySelect.addEventListener("change", runCluster);
spaceSelect.addEventListener("change", runCluster);
chartSelect.addEventListener("change", function () {
  updateChartNote();
  if (lastResult.length) renderChart(lastResult);
});
meanChartSelect.addEventListener("change", function () {
  if (lastResult.length) renderMeanChart(lastResult);
});
exportJsonBtn.addEventListener("click", exportJson);
exportCsvBtn.addEventListener("click", exportCsv);
aiAnalyzeBtn.addEventListener("click", runAiAnalyze);
window.addEventListener("resize", function () {
  if (chart) chart.resize();
  if (meanChart) meanChart.resize();
  if (lastResult.length) updateColorCarousel();
});

function setPreviewMode(mode) {
  for (var i = 0; i < previewViews.length; i++) {
    previewViews[i].classList.toggle("is-visible", previewViews[i].getAttribute("data-preview") === mode);
  }
  previewOriginalBtn.classList.toggle("is-active", mode === "original");
  previewClusterBtn.classList.toggle("is-active", mode === "cluster");
}

function updateChartNote() {
  if (!chartNote) return;
  var names = {
    pie: "模式：饼状占比",
    donut: "模式：环形占比",
    bar: "模式：主色数量柱状对比",
    rose: "模式：玫瑰面积占比",
    treemap: "模式：矩形面积占比"
  };
  chartNote.textContent = names[chartSelect.value] || "模式：颜色占比";
}

previewOriginalBtn.addEventListener("click", function () { setPreviewMode("original"); });
previewClusterBtn.addEventListener("click", function () { setPreviewMode("cluster"); });
colorPrev.addEventListener("click", function () {
  colorPage--;
  updateColorCarousel();
});
colorNext.addEventListener("click", function () {
  colorPage++;
  updateColorCarousel();
});
updateChartNote();
if (spaceLabel) spaceLabel.textContent = spaceSelect.value.toUpperCase() + " 聚类";
setPreviewMode("original");

clearCanvas(sourceCanvas, "正在加载示例图");
clearCanvas(clusterCanvas, "等待聚类");
makeSampleImage("landscape");
