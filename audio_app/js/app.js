(function() {
  var a   = new AudioContext();
  var src = a.createBufferSource();

  var ws = new WebSocket("ws://localhost:8001");

  ws.onmessage = function(msg) {
    var data = JSON.parse(msg.data);

    $("#main").text(data.join(", "));
  };

  // context - AudioContext
  (function(context) {
    var req = new XMLHttpRequest();

    req.open("GET", "./media/crook.mp3", true);

    req.responseType = "arraybuffer";

    req.onload = function() {
      context.decodeAudioData(req.response, function(buf) {
        src.buffer = buf;

        src.connect(a.destination);
        //src.start(0);
      }, null);
    }

    req.send();
  })(a);
})();
