God.watch do |w|
  w.name  = "ff-transmitter"
  w.start = "ruby app.rb"
  w.log   = "server.log"

  w.behavior(:clean_pid_file)

  w.keepalive
end
