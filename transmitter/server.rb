require "serialport"
require "osc-ruby"

include OSC

config = {
  arduino_serial: "/dev/ttyACM0",
  baud_rate:      115200
}

client = OSC::Client.new("192.168.0.107", 57777)
serial = SerialPort.new("/dev/ttyACM0", 115200);

def log(msg) 
  puts "[#{Time.now}] #{msg}"
end

def log_error(msg)
  log("Error: #{msg}")
end

def parse_data(data)
  #p data

  begin
    data.split(",").select.with_index {|_, ndx| ndx.odd? }.map(&:to_f)
  rescue ArgumentError => e
    log_error(e)
  ensure
    []
  end
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

    log(floats)

    log("Average #{avg}")
    log("Zone Averages #{zavgs}")

    msgs.each do |k, v| 
      begin
        client.send(v) 
      rescue Errno::ECONNREFUSED => e
        log_error("[#{k}, #{v}] #{e}")
      end
    end
  end
end
