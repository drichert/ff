$(function() {
  var a      = new AudioContext();
  var src    = a.createBufferSource();
  var gain   = a.createGain();
  var buffer = null;

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

      playerBank.update(data);
                //.setLevels(data)
                //.setLoopPoints(data);
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
    });
  };

  (function() {
    for(var i = 0; i < this.numNodes; i++) {
      this.nodes[i] = this.context.createOscillator();
      this.nodes[i].frequency.value = this.minFreq;
      this.nodes[i].start();
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
  this.buffer    = null;

  this.position = 0; // sec?
  this.rate     = 1; // ???

  // data - Array from data source; should be an array of 200 0..1024 numbers
  this.update = function(data) {
    // convert to an array of 0..1 values
    //var scalars = data.map(function(n) { return n / 1024.0; });

    //this.modBank.setFreqs(scalars);

    //for(var i = 0; i < this.numNodes; i++) {
    //  this.modBank.nodes[i].connect(this.nodes[i].playbackRate);
    //}

    return this.setupBufferSources()
               //.setupModulators(data)
               .setLevels(data)
               .setLoopPoints(data)
               .start();
  };

  this.setupBufferSources = function() {
    for(var i = 0; i < this.numNodes; i++) {
      if(this.nodes[i]) {
        this.nodes[i].disconnect();
      }

      this.nodes[i] = this.context.createBufferSource();

      this.nodes[i].buffer = this.buffer;
      this.nodes[i].connect(this.gainNodes[i]);
    }

    return this;
  };

  //this.setupModulators = function(data) {
  //  // convert to an array of 0..1 values
  //  var scalars = data.map(function(n) { return n / 1024.0; });

  //  this.modBank.setFreqs(scalars);

  //  for(var i = 0; i < this.numNodes; i++) {
  //    this.modBank.nodes[i].connect(this.nodes[i].playbackRate);
  //  }

  //  return this;
  //};

  this.setLevels = function(data) {
    var that = this;
    // convert to an array of 0..1 values
    // TODO: DRY
    var scalars = data.map(function(n) { return n / 1024.0; });

    scalars.forEach(function(n, ndx) {
      that.gainNodes[ndx].gain.value = Math.pow(n, 2);
    });

    return this;
  };

  this.segLength = function() {
    return this.buffer.duration / this.numNodes;
  };

  this.startPosition = function(nodeNum) {
    return this.segLength() * nodeNum;
  };

  this.endPosition = function(nodeNum) {
    return this.segLength() * nodeNum + this.segLength();
  };

  this.setLoopPoints = function(data) {
    var that = this;

    this.nodes.forEach(function(node, ndx) {
      //var node = this.nodes[nodeNum];
      // convert to an array of 0..1 values
      // TODO: DRY
      var scalars = data.map(function(n) { return n / 1024.0; });

      var loopLen = (that.segLength() * scalars[ndx]) / 3;
      //console.log("loop len", loopLen, "seg len", that.segLength());

      var halfLen = loopLen / 2;

      var startPos = that.startPosition(ndx) +
        (that.segLength() / 2) - halfLen;

      node.loop = true;
      //node.loopStart = this.startPosition(ndx);
      //node.loopEnd   = this.endPosition(ndx);

      node.loopStart = startPos;
      node.loopEnd   = startPos + loopLen;
    });

    return this;
  };

  this.setupGainNodes = function() {
    for(var i = 0; i < this.numNodes; i++) {
      this.gainNodes[i] = this.context.createGain();
      this.gainNodes[i].connect(this.context.destination);
    }

    return this;
  };

  this.start = function() {
    var that = this;
    //console.log(this.nodes);
    //this.nodes.forEach(function(node, ndx) {
    //  node.start(
    //    that.context.currentTime + (that.segLength() * ndx), 
    //    node.loopStart, 
    //    that.segLength()
    //  );
    //});

    var node = this.nodes[Math.floor(Math.random() * this.nodes.length)];

    node.start(
      this.context.currentTime,  
      node.loopStart,
      this.segLength() * 100
     );
  };

  (function() {
    var that = this;

    this.setupGainNodes();

    //this.modBank = new ModBank(this.context);

    var req = new XMLHttpRequest();

    req.open("GET", that.path, true);
    req.responseType = "arraybuffer";

    req.onload = function() {
      that.context.decodeAudioData(req.response, function(buf) {
        that.buffer = buf;
      }, null);

      that.callback();
    }

    req.send();
  }).call(this);
};
