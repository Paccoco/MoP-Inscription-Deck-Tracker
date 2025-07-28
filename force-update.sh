#!/bin/bash
# Force Update Script for Production Servers
# This script handles git conflicts by stashing local changes and forcing the update

set -e

echo "=== Force Update for Production Server ==="
echo "⚠️  WARNING: This will stash all local changes and force update from repository"
echo "Local changes will be preserved in git stash"
echo ""

# Get current directory and setup variables
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"
BACKUP_DIR="$HOME/mop-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Verify we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in current directory"
    echo "Please run this script from the MoP-Inscription-Deck-Tracker directory"
    exit 1
fi

# Ask for confirmation unless --yes flag is provided
if [ "$1" != "--yes" ]; then
    echo "Files with local changes:"
    git status --porcelain || true
    echo ""
    read -p "Continue with force update? [y/N]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Update cancelled"
        exit 1
    fi
fi

echo "🛑 Stopping application..."
pm2 stop mop-card-tracker 2>/dev/null || echo "Application was not running"

echo "💾 Creating emergency backup..."
# Create backup directory
mkdir -p "$BACKUP_DIR"
# Create backup info file
echo "FORCE_UPDATE_BACKUP_TIMESTAMP=$TIMESTAMP" > "$BACKUP_DIR/force-backup-info.txt"
echo "BACKUP_DATE=$(date)" >> "$BACKUP_DIR/force-backup-info.txt"

# Backup database if it exists
if [ -f "cards.db" ]; then
    cp "cards.db" "$BACKUP_DIR/cards.db.force-backup-$TIMESTAMP"
    echo "Database backed up to: $BACKUP_DIR/cards.db.force-backup-$TIMESTAMP"
fi

# Backup environment file if it exists
if [ -f ".env" ]; then
    cp ".env" "$BACKUP_DIR/.env.force-backup-$TIMESTAMP"
    echo "Environment backed up to: $BACKUP_DIR/.env.force-backup-$TIMESTAMP"
fi

echo "💾 Stashing local changes..."
# Add all files (including untracked) and stash them
git add -A
git stash push -m "Production server auto-stash before force update $(date)"

echo "🧹 Cleaning working directory..."
# Reset any partial merges or conflicts
git reset --hard HEAD
git clean -fd

echo "📥 Fetching latest changes..."
git fetch origin

echo "🔄 Pulling latest code..."
git pull origin master || git pull origin main

echo "🔧 Making scripts executable..."
chmod +x update.sh 2>/dev/null || true
if [ -d "scripts" ]; then
    chmod +x scripts/update.sh scripts/rollback.sh 2>/dev/null || true
fi

echo "🏃 Running normal update process..."
# Now run the regular update script with custom backup directory
if ./update.sh --skip-git --backup-dir "$BACKUP_DIR"; then
    echo ""
    echo "✅ Force update completed successfully!"
    echo ""
    echo "📋 Your local changes were stashed and can be recovered with:"
    echo "   git stash list    # View stashed changes"
    echo "   git stash pop     # Restore latest stashed changes"
    echo "   git stash show    # Preview stashed changes"
    echo ""
    echo "🔍 Application status:"
    pm2 status mop-card-tracker 2>/dev/null || echo "Use 'pm2 status' to check application status"
    echo ""
    echo "💾 Emergency backup location: $BACKUP_DIR"
else
    echo ""
    echo "❌ Force update failed!"
    echo ""
    echo "🔄 Attempting to restore from emergency backup..."
    
    # Try to restore from stash first
    if git stash list | grep -q "Production server auto-stash"; then
        echo "Restoring from git stash..."
        git stash pop
    fi
    
    # Restore database if backup exists
    if [ -f "$BACKUP_DIR/cards.db.force-backup-$TIMESTAMP" ]; then
        echo "Restoring database from emergency backup..."
        cp "$BACKUP_DIR/cards.db.force-backup-$TIMESTAMP" "cards.db"
    fi
    
    # Restore environment file if backup exists
    if [ -f "$BACKUP_DIR/.env.force-backup-$TIMESTAMP" ]; then
        echo "Restoring environment from emergency backup..."
        cp "$BACKUP_DIR/.env.force-backup-$TIMESTAMP" ".env"
    fi
    
    # Try to start the application
    echo "Attempting to restart application..."
    pm2 start ecosystem.config.js 2>/dev/null || echo "Failed to restart application"
    
    echo ""
    echo "❌ Update failed. System restored to previous state."
    echo "Check the logs with: pm2 logs mop-card-tracker"
    exit 1
fi
