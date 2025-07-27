#!/bin/bash
# Force Update Script for Production Servers
# This script handles git conflicts by stashing local changes and forcing the update

set -e

echo "=== Force Update for Production Server ==="
echo "⚠️  WARNING: This will stash all local changes and force update from repository"
echo "Local changes will be preserved in git stash"
echo ""

# Get current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

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
chmod +x update.sh scripts/update.sh scripts/rollback.sh 2>/dev/null || true

echo "🏃 Running normal update process..."
# Now run the regular update script
./update.sh --skip-git

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
