require "net/ssh/shell"

def rpi_default_ip
  "192.168.1.111"
end

def rpi_user
  "pi"
end

def rpi_ip
  if !ENV["RPI_IP"]
    puts "Using default static IP (#{rpi_default_ip})"
  end

  ENV["RPI_IP"] || rpi_default_ip
end

def transmitter_dir
  "/home/pi/transmitter"
end

namespace :deploy do
  desc "Deploy transmitter to RPi"
  task :push do
    system("rsync -avz rsync ./transmitter/ pi@#{rpi_ip}:#{transmitter_dir}")
  end

  desc "Pull transmitter to local ./tmp"
  task :pull do
    system("rsync -avz pi@#{rpi_ip}:#{transmitter_dir} ./tmp")
  end
end

namespace :transmitter do
  desc "Start transmitter"
  task :start do
    Net::SSH.start(rpi_ip, rpi_user) do |ssh|
      ssh.shell do |sh|
        sh.execute("cd #{transmitter_dir}")

        status_process = sh.execute!("bundle exec god status")

        if status_process.exit_status.to_i == 1
          print "God not running, starting... "
          sh.execute("bundle exec god -c config.god")
          print "done.\n"
        else
          print "ff-transmitter watch not running, starting... "
          sh.execute("bundle exec god start ff-transmitter")
          print "done.\n"
        end

        sh.wait!
      end
    end
  end

  desc "Stop transmitter"
  task :stop do
    Net::SSH.start(rpi_ip, rpi_user) do |ssh|
      ssh.shell do |sh|
        sh.execute("cd #{transmitter_dir}")

        print "Stopping ff-transmitter... "
        sh.execute!("bundle exec god stop ff-transmitter")
        print "done.\n"
      end
    end
  end

  desc "Restart transmitter"
  task :restart do
    Net::SSH.start(rpi_ip, rpi_user) do |ssh|
      ssh.shell do |sh|
        sh.execute("cd #{transmitter_dir}")

        print "Restarting ff-transmitter... "
        sh.execute!("bundle exec god restart ff-transmitter")
        print "done.\n"
      end
    end
  end
end
