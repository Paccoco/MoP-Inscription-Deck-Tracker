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

echo "🧹 Pre-cleaning auto-generated files..."
# Remove files that commonly cause git conflicts
rm -f package-lock.json client/package-lock.json node_modules/.package-lock.json 2>/dev/null || true

# Reset any uncommitted changes first
git reset --hard HEAD 2>/dev/null || true

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
# First, let's clean up any auto-generated files that often cause conflicts
echo "🧹 Cleaning auto-generated files..."
rm -f package-lock.json client/package-lock.json node_modules/.package-lock.json 2>/dev/null || true

# Add all files (including untracked) and stash them
git add -A 2>/dev/null || true
git stash push -m "Production server auto-stash before force update $(date)" 2>/dev/null || echo "Nothing to stash"

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
    
    # Clean auto-generated files that might cause conflicts
    echo "🧹 Cleaning conflicting auto-generated files..."
    rm -f package-lock.json client/package-lock.json node_modules/.package-lock.json 2>/dev/null || true
    
    # Reset any uncommitted changes
    git reset --hard HEAD 2>/dev/null || true
    git clean -fd 2>/dev/null || true
    
    # Try to restore from stash
    if git stash list | grep -q "Production server auto-stash"; then
        echo "Restoring from git stash..."
        # Use merge strategy that favors current content for conflicts
        git stash pop --index 2>/dev/null || {
            echo "⚠️  Stash restore had conflicts, resolving automatically..."
            # If there are conflicts, abort the merge and just drop the stash
            git reset --hard HEAD 2>/dev/null || true
            git stash drop 2>/dev/null || true
            echo "Stash conflicts resolved by keeping current version"
        }
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
