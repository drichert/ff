God.watch do |w|
  w.name  = "ff-sensor-server"
  w.start = "ruby server.rb"
  w.log   = "server.log"

  w.behavior(:clean_pid_file)

  w.keepalive
end
