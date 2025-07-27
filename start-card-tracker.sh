#!/bin/bash
# Start the Mist of Pandaria Card Tracker with PM2

set -e

echo "Starting MoP Card Tracker with PM2..."

cd /home/paccoco/MoP-Inscription-Deck-Tracker

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found. Installing PM2..."
    npm install -g pm2
fi

# Stop existing instance if running
pm2 stop mop-card-tracker 2>/dev/null || true

# Start with PM2 using ecosystem file
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script (if not already done)
pm2 startup 2>/dev/null || true

echo "Card Tracker started successfully with PM2!"
echo "Use 'pm2 logs mop-card-tracker' to view logs"
echo "Use 'pm2 status' to check status"
