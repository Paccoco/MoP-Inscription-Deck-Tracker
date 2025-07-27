#!/bin/bash

# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR/.."

# Create backup
echo "Creating backup..."
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp package.json "$BACKUP_DIR/"
cp -r client/build "$BACKUP_DIR/client-build" 2>/dev/null

# Fetch latest changes
echo "Fetching latest changes..."
git fetch origin

# Get the latest tag
LATEST_TAG=$(git describe --tags `git rev-list --tags --max-count=1`)

# Stash local changes if any
git stash

# Checkout the latest tag
echo "Updating to $LATEST_TAG..."
git checkout $LATEST_TAG

# Install dependencies
echo "Installing server dependencies..."
npm install

# Build client
echo "Building client..."
cd client
npm install
npm run build
cd ..

# Restart the service using pm2
echo "Restarting service..."
pm2 restart mop-inscription-tracker

echo "Update complete!"
