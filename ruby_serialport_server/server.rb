require "serialport"
require "osc-ruby"

config = { arduino_serial: "/dev/ttyACM0",
  baud_rate: 115200 }

client = OSC::Client.new("192.168.0.107", 57777)

serial = SerialPort.new("/dev/ttyACM0", 115200);

def parse_data(data)
  data.split(",").select.with_index {|_, ndx| ndx.odd? }.map(&:to_f)
end

def zone_avgs(data, num_zones = 5)
  zone_size = data.size / num_zones

  avgs = []
  num_zones.times do |n|
    avgs << (zone = data[(start = zone_size * n)..(start + zone_size - 1)])
      .reduce(:+) / zone.size
  end
  avgs
end

while true do
  while(line = serial.gets) do
    floats   = parse_data(line)
    avg      = floats.inject(:+) / floats.size
    zavgs    = zone_avgs(floats)

    msgs = {
      data:      OSC::Message.new("/data", *floats),
      avg:       OSC::Message.new("/avg", avg),
      zone_avgs: OSC::Message.new("/zone_avgs", *zavgs)
    }

    puts "Average #{avg}"
    puts "Zone Averages #{zavgs}"

    msgs.each {|k, v| client.send(v) }
  end
end

