#!/bin/bash
# Start the Mist of Pandaria Card Tracker

cd /home/paccoco/project-card-tracker
nohup node server.js > server.log 2>&1 &
echo "Card Tracker backend started."
