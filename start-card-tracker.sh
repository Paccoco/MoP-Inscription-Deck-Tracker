#!/bin/bash
# Start the Mist of Pandaria Card Tracker

cd /home/paccoco/MoP-Inscription-Deck-Tracker
nohup node server-auth.js > server.log 2>&1 &
echo "Card Tracker backend started."
