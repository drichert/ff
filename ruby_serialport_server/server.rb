require "serialport"
require "osc-ruby"

config = { arduino_serial: "/dev/ttyACM0", baud_rate: 115200 }
client = OSC::Client.new("192.168.0.107", 57777)
serial = SerialPort.new("/dev/ttyACM0", 115200);

def parse_data(data)
  data.split(",").select.with_index {|_, ndx| ndx.odd? }.map(&:to_f)
end

while true do
  while(line = serial.gets) do
    sensor_values = OSC::Message.new("/data", *parse_data(line))

    client.send(sensor_values)
  end
end
