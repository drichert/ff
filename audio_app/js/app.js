$(function() {
  var a    = new AudioContext();
  var src  = a.createBufferSource();
  var gain = a.createGain();

  var sock = new WebSocket("ws://localhost:8001");
  var chart = null;

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

  var playerBank = new PlayerBank(a, "./media/crook.mp3", function() {
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

      playerBank.update(data).setLevels(data);
    };
  });
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

      node.frequency.value = freq;
      //node.frequency.exponentialRampToValueAtTime(freq,
      //  that.context.currentTime + 0.001);

      node.start();
    });
  };

  (function() {
    for(var i = 0; i < this.numNodes; i++) {
      this.nodes[i] = this.context.createOscillator();
      this.nodes[i].frequency.value = this.minFreq;
    }
  }).call(this);
};

var PlayerBank = function(audioContext, path, cbk) {
  this.path = path;
  this.context = audioContext;
  this.callback = cbk;

  this.numNodes  = 200;
  this.nodes     = [];
  this.gainNodes = [];

  this.position = 0; // sec?
  this.rate     = 1; // ???

  // data - Array from data source; should be an array of 200 0..1024 numbers
  this.update = function(data) {
    // convert to an array of 0..1 values
    var scalars = data.map(function(n) { return n / 1024.0; });

    this.modBank.setFreqs(scalars);

    for(var i = 0; i < this.numNodes; i++) {
      this.modBank.nodes[i].connect(this.nodes[i].playbackRate);
    }

    return this;
  };

  this.setLevels = function(data) {
    var that = this;
    // convert to an array of 0..1 values
    // TODO: DRY
    var scalars = data.map(function(n) { return n / 1024.0; });

    scalars.forEach(function(n, ndx) {
      console.log(arguments);
      that.gainNodes[ndx].gain.value = n;
    });
  };

  (function() {
    var that = this;

    this.modBank = new ModBank(this.context);

    var req = new XMLHttpRequest();

    req.open("GET", that.path, true);
    req.responseType = "arraybuffer";

    req.onload = function() {
      that.context.decodeAudioData(req.response, function(buf) {
        for(var i = 0; i < that.numNodes; i++) {
          that.nodes[i] = that.context.createBufferSource();

          that.nodes[i].buffer = buf;
          that.nodes[i].loop   = true;

          that.gainNodes[i] = that.context.createGain();
          that.gainNodes[i].connect(that.context.destination);

          that.nodes[i].connect(that.gainNodes[i]);
          that.nodes[i].start();
        }
      }, null);

      that.callback();
    }

    req.send();
  }).call(this);
};
