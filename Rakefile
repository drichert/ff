def rpi_ip
  ENV["RPI_IP"] || "192.168.1.111"
end

namespace :deploy do
  desc "Deploy transmitter to RPi"
  task :push do
    system("rsync -avz rsync ./transmitter/ pi@#{rpi_ip}:/home/pi/transmitter")
  end

  desc "Pull transmitter to local ./tmp"
  task :pull do
    system("rsync -avz pi@#{rpi_ip}:/home/pi/transmitter ./tmp")
  end
end
