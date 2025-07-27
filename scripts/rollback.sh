#!/bin/bash

# Get backup directory from argument
BACKUP_DIR="$1"

if [ -z "$BACKUP_DIR" ]; then
    echo "Error: Backup directory not specified"
    exit 1
fi

if [ ! -d "$BACKUP_DIR" ]; then
    echo "Error: Backup directory $BACKUP_DIR does not exist"
    exit 1
fi

# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR/.."

echo "Starting rollback from $BACKUP_DIR..."

# Stop the service
echo "Stopping service..."
pm2 stop mop-inscription-tracker

# Restore backed up files
echo "Restoring files from backup..."
if [ -f "$BACKUP_DIR/package.json" ]; then
    cp "$BACKUP_DIR/package.json" .
fi

if [ -d "$BACKUP_DIR/client-build" ]; then
    rm -rf client/build
    cp -r "$BACKUP_DIR/client-build" client/build
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Restart the service
echo "Restarting service..."
pm2 restart mop-inscription-tracker

echo "Rollback complete!"
