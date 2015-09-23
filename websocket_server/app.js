var serialport = require("serialport");
var websocket  = require("websocket");
var http       = require("http");

var port = 8181;

var server = new http.createServer();
var socket = new websocket.server({ httpServer: server });

var stack = []
var clients = [];

var parseData = function(data) {
  return data.split(",").slice(0, -1).filter(function(val, ndx) {
    return ndx % 2;
  });
};

var serial = new serialport.SerialPort("/dev/ttyACM0", {
  baudrate: 115200,
  parser:   serialport.parsers.readline("\n")
});

var connection = null;

serial.on("open", function() {
  console.log("Serial Port Opened");

  serial.on("data", function(data){
    var json = JSON.stringify(parseData(data));

    if(connection) connection.send(json);
  });
});

socket.on("request", function(request) {
  connection = request.accept(null, request.origin);
});

server.listen(port, function() {
  console.log("Server listening on port " + port);
});

