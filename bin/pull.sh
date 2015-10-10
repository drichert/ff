#/bin/bash

ip=$1

if [ "$#" -ne 1 ]; then
  echo "Pull currently deployed transmitter from RPi to local ./tmp"
  echo "Usage: $0 <rpi_ip>"

  exit 1
fi

rsync -avz pi@$ip:/home/pi/transmitter ./tmp
