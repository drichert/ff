var Server = require("ws").Server;
var server = new Server({ port: 8001 });

var mockData = function() {
  var vals = 200;
  var arr  = [];

  for(var i = 0; i < vals; i++) {
    arr[i] = Math.floor(Math.random() * 1024);
  }

  return JSON.stringify(arr);
};

server.on("connection", function(s) {
  s.on("data:dump", function() {
    s.send(mockData());
  });

  setInterval(function() {
    s.emit("data:dump");
  }, 300);
});
