#!/bin/bash

# Kill any existing instances
pm2 delete mop-card-tracker 2>/dev/null

# Build the React app
cd client && npm run build
cd ..

# Start the server
NODE_ENV=production pm2 start ecosystem.config.js

# Save the PM2 process list
pm2 save

# Display status
pm2 status
