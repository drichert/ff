$(function() {
  var a    = new AudioContext();
  var src  = a.createBufferSource();
  var gain = a.createGain();

  // UI setup
  (function() {
    $("#level_slider").slider({
      min: 0,
      max: 128,
      slide: function(ev, sl) {
        gainVal = sl.value / 128.0;

        gain.gain.value = gainVal;
        $("#current_level").text(gainVal);
      }
    });
  })();

  var sock = new WebSocket("ws://localhost:8001");
  var chart = null;

  sock.onmessage = function(msg) {
    var data   = JSON.parse(msg.data);
    var canvas = $("#chart")[0].getContext("2d");

    var datasets = [{ data: data, fillColor: "#abc" }];

    var labels = Array.apply(null, Array(200)).map(
      String.prototype.valueOf, "");

    if(!chart) {
      chart = new Chart(canvas).Bar({
        labels:   labels,
        datasets: datasets
      }, {
        animation:                true,
        animationSteps:           10,
        scaleOverride:            true,
        scaleStartValue:          0,
        scaleStepWidth:           64,
        scaleSteps:               16,
        barShowStroke:            false,
        barDataSetSpacing:        3,
        scaleShowVerticalLines:   false,
        scaleShowHorizontalLines: false
      });
    }
    else {
      data.forEach(function(n, ndx) {
        chart.datasets[0].bars[ndx].value = n;
      });

      chart.update();
    }
  };

  // context - AudioContext
  (function(context) {
    var req = new XMLHttpRequest();

    req.open("GET", "./media/crook.mp3", true);

    req.responseType = "arraybuffer";

    req.onload = function() {
      context.decodeAudioData(req.response, function(buf) {
        src.buffer = buf;

        var modBank = new ModBank(context);

        src.connect(gain);
        gain.connect(context.destination);

        src.start(0);
      }, null);
    }

    req.send();
  })(a);
});

var ModBank = function(audioContext) {
  this.context = audioContext;
  this.numNodes = 200;

  this.maxFreq = 20; // Hz
  this.minFreq = 0.001; // Hz

  this.nodes = [];

  // freqs - Array of frequency scalars (values 0..1)
  this.setFreqs = function(freqs) {
    var that = this;

    this.nodes.forEach(function(node, ndx) {
      var freq = freqs[ndx] * that.maxFreq + that.minFreq;

      node.exponentialRampToValueAtTime(freq,
        context.currentTime + 0.001);
    });
  };

  (function() {
    for(var i = 0; i < this.numNodes; i++) {
      this.nodes[i] = audioContext.createOscillator();
      this.nodes[i].frequency.value = this.minFreq;
    }
  }).call(this);
};
