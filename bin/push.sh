#!/bin/bash

ip=$1

if [ "$#" -ne 1 ]; then
  echo "Deploy transmitter to RPi"
  echo "Usage: $0 <rpi_ip>"

  exit 1
fi

rsync -avz rsync ./transmitter/ pi@$ip:/home/pi/transmitter
