#!/bin/bash
# Update Script for MoP Inscription Deck Tracker
# This script handles updates while preserving data and using PM2

set -e

echo "=== MoP Inscription Deck Tracker Update ==="

# Configuration
APP_DIR="/home/paccoco/MoP-Inscription-Deck-Tracker"
BACKUP_DIR="$HOME/mop-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Function to create backup
create_backup() {
    echo "Creating backup..."
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if [ -f "$APP_DIR/cards.db" ]; then
        cp "$APP_DIR/cards.db" "$BACKUP_DIR/cards.db.backup-$TIMESTAMP"
        echo "Database backed up to: $BACKUP_DIR/cards.db.backup-$TIMESTAMP"
    fi
    
    # Backup environment file
    if [ -f "$APP_DIR/.env" ]; then
        cp "$APP_DIR/.env" "$BACKUP_DIR/.env.backup-$TIMESTAMP"
        echo "Environment file backed up to: $BACKUP_DIR/.env.backup-$TIMESTAMP"
    fi
    
    # Full application backup
    if [ -d "$APP_DIR" ]; then
        tar -czf "$BACKUP_DIR/app-backup-$TIMESTAMP.tar.gz" -C "$(dirname "$APP_DIR")" "$(basename "$APP_DIR")"
        echo "Full backup created: $BACKUP_DIR/app-backup-$TIMESTAMP.tar.gz"
    fi
}

# Function to stop application
stop_application() {
    echo "Stopping application..."
    pm2 stop mop-card-tracker 2>/dev/null || echo "Application was not running"
}

# Function to start application
start_application() {
    echo "Starting application with PM2..."
    cd "$APP_DIR"
    pm2 start ecosystem.config.js
    pm2 save
    echo "Application started successfully!"
}

# Function to update from git
update_from_git() {
    echo "Updating from Git repository..."
    cd "$APP_DIR"
    
    # Save current branch
    CURRENT_BRANCH=$(git branch --show-current)
    echo "Current branch: $CURRENT_BRANCH"
    
    # Fetch latest changes
    git fetch origin
    
    # Check if we're on a specific branch or should update to master
    if [ "$1" = "master" ] || [ "$1" = "main" ]; then
        echo "Switching to master/main branch..."
        git checkout main 2>/dev/null || git checkout master 2>/dev/null
        git pull origin main 2>/dev/null || git pull origin master 2>/dev/null
    else
        echo "Updating current branch: $CURRENT_BRANCH"
        git pull origin "$CURRENT_BRANCH"
    fi
}

# Function to update dependencies
update_dependencies() {
    echo "Updating dependencies..."
    cd "$APP_DIR"
    
    # Update server dependencies
    npm install
    
    # Update client dependencies
    cd client
    npm install
    cd ..
}

# Function to rebuild frontend
rebuild_frontend() {
    echo "Rebuilding frontend..."
    cd "$APP_DIR/client"
    npm run build
    cd ..
}

# Function to run database migrations (if any)
run_migrations() {
    echo "Checking for database migrations..."
    cd "$APP_DIR"
    
    # If migration script exists, run it
    if [ -f "scripts/migrate.js" ]; then
        echo "Running database migrations..."
        node scripts/migrate.js
    else
        echo "No migration script found, skipping..."
    fi
}

# Function to verify update
verify_update() {
    echo "Verifying update..."
    
    # Check if PM2 process is running
    if pm2 list | grep -q "mop-card-tracker.*online"; then
        echo "✅ PM2 process is running"
    else
        echo "❌ PM2 process is not running"
        return 1
    fi
    
    # Check if app responds
    sleep 5
    if curl -f http://localhost:5000/api/version >/dev/null 2>&1; then
        echo "✅ Application is responding"
    else
        echo "❌ Application is not responding"
        return 1
    fi
    
    echo "Update verification successful!"
}

# Function to rollback if needed
rollback() {
    echo "⚠️  Rolling back to previous version..."
    
    # Stop current application
    pm2 stop mop-card-tracker 2>/dev/null || true
    
    # Restore from backup
    if [ -f "$BACKUP_DIR/app-backup-$TIMESTAMP.tar.gz" ]; then
        echo "Restoring from backup..."
        cd "$(dirname "$APP_DIR")"
        rm -rf "$APP_DIR"
        tar -xzf "$BACKUP_DIR/app-backup-$TIMESTAMP.tar.gz"
        
        # Start application
        cd "$APP_DIR"
        pm2 start ecosystem.config.js
        
        echo "Rollback completed"
    else
        echo "❌ No backup found for rollback!"
        exit 1
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  --branch <branch>  Update to specific branch (default: current branch)"
    echo "  --master          Update to master/main branch"
    echo "  --verify-only     Only verify current installation"
    echo "  --rollback        Rollback to previous backup"
    echo "  --help            Show this help message"
}

# Main update process
main() {
    echo "Starting update process..."
    
    # Parse command line arguments
    BRANCH=""
    VERIFY_ONLY=false
    ROLLBACK=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --branch)
                BRANCH="$2"
                shift 2
                ;;
            --master)
                BRANCH="master"
                shift
                ;;
            --verify-only)
                VERIFY_ONLY=true
                shift
                ;;
            --rollback)
                ROLLBACK=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Handle special cases
    if [ "$ROLLBACK" = true ]; then
        rollback
        exit 0
    fi
    
    if [ "$VERIFY_ONLY" = true ]; then
        verify_update
        exit 0
    fi
    
    # Check if app directory exists
    if [ ! -d "$APP_DIR" ]; then
        echo "❌ Application directory not found: $APP_DIR"
        echo "Please run the installation script first"
        exit 1
    fi
    
    # Check if PM2 is installed
    if ! command -v pm2 >/dev/null 2>&1; then
        echo "❌ PM2 is not installed"
        echo "Installing PM2..."
        npm install -g pm2
    fi
    
    # Create backup
    create_backup
    
    # Stop application
    stop_application
    
    # Update from git
    if [ -n "$BRANCH" ]; then
        update_from_git "$BRANCH"
    else
        update_from_git
    fi
    
    # Update dependencies
    update_dependencies
    
    # Rebuild frontend
    rebuild_frontend
    
    # Run migrations
    run_migrations
    
    # Start application
    start_application
    
    # Verify update
    if ! verify_update; then
        echo "❌ Update verification failed, rolling back..."
        rollback
        exit 1
    fi
    
    echo ""
    echo "=== Update Complete! ==="
    echo "Application updated successfully"
    echo "Backup location: $BACKUP_DIR"
    echo ""
    echo "Useful commands:"
    echo "  pm2 logs mop-card-tracker  - View logs"
    echo "  pm2 status                 - Check status"
    echo "  ./update.sh --rollback     - Rollback if needed"
    echo ""
}

# Trap errors and offer rollback
trap 'echo "❌ Update failed! Run: ./update.sh --rollback"; exit 1' ERR

# Run main function
main "$@"
