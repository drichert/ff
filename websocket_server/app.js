var serialport = require("serialport");
//var websocket  = require("websocket");
var http       = require("http");
var osc        = require("node-osc");
//var osc = require("osc-min");
//var udp = require("dgram");

var port = 8181;

var server = new http.createServer();
//var socket = new websocket.server({ httpServer: server });

//var stack = []

var oscClient = new osc.Client("127.0.0.1", 57777);

var parseData = function(data) {
  data = data.split(",").slice(0, -1).filter(function(val, ndx) {
    return ndx % 2;
  }).map(function(n) {
    return parseFloat(n);
  });

  return data;
};

//var parseData = function(data) {
//  return data.split(",").slice(0, -1);
//};

var serial = new serialport.SerialPort("/dev/ttyACM0", {
  baudrate: 115200,
  parser:   serialport.parsers.readline("\n")
});

var connection = null;

serial.on("open", function() {
  console.log("Serial Port Opened");

  serial.on("data", function(data){
    //var json = JSON.stringify(parseData(data));

    //if(connection) connection.send(json);
    //oscClient.send("/data", json);
    oscClient.send("/data", parseData(data));
  });
});

//socket.on("request", function(request) {
//  connection = request.accept(null, request.origin);
//});

server.listen(port, function() {
  console.log("Server listening on port " + port);
});

