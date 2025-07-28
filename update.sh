#!/bin/bash
# Update Script for MoP Inscription Deck Tracker
# This script handles updates while preserving data and using PM2

set -e

echo "=== MoP Inscription Deck Tracker Update ==="

# Configuration - Auto-detect app directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
APP_DIR="$SCRIPT_DIR"
BACKUP_DIR="$HOME/mop-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Command line options
FORCE_UPDATE=false
SKIP_GIT=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE_UPDATE=true
            echo "🚨 Force update enabled - will overwrite local changes"
            shift
            ;;
        --backup-dir)
            BACKUP_DIR="$2"
            echo "📁 Using custom backup directory: $BACKUP_DIR"
            shift 2
            ;;
        --skip-git)
            SKIP_GIT=true
            echo "⏭️  Skipping git operations"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --force       Force update, overwriting local changes"
            echo "  --backup-dir  Specify custom backup directory"
            echo "  --skip-git    Skip git pull operations"
            echo "  --help, -h    Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Verify we're in the correct directory
if [ ! -f "$APP_DIR/package.json" ]; then
    echo "❌ Error: package.json not found in $APP_DIR"
    echo "Please run this script from the MoP-Inscription-Deck-Tracker directory"
    exit 1
fi

echo "📁 Working directory: $APP_DIR"

# Function to ensure required directories exist
setup_directories() {
    echo "Setting up required directories..."
    cd "$APP_DIR"
    
    # Create logs directory for PM2
    mkdir -p logs
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Create .env file from example if it doesn't exist
    if [ ! -f ".env" ] && [ -f ".env.example" ]; then
        echo "Creating .env file from .env.example..."
        cp ".env.example" ".env"
        echo "⚠️  Please edit .env file with your configuration before starting the application"
    fi
    
    echo "Directory setup completed!"
}

# Function to create backup
create_backup() {
    echo "Creating backup..."
    mkdir -p "$BACKUP_DIR"
    
    # Check if backup directory already has content (e.g., from admin UI)
    if [ -n "$(find "$BACKUP_DIR" -maxdepth 1 -name "*.backup-*" 2>/dev/null)" ]; then
        echo "Backup directory already contains backups, skipping duplicate backup creation"
        return 0
    fi
    
    # Create backup info file to track backup details
    echo "BACKUP_TIMESTAMP=$TIMESTAMP" > "$BACKUP_DIR/backup-info.txt"
    echo "APP_DIR=$APP_DIR" >> "$BACKUP_DIR/backup-info.txt"
    echo "BACKUP_DATE=$(date)" >> "$BACKUP_DIR/backup-info.txt"
    
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
    
    # Full application backup (excluding PM2 runtime files and other temp files)
    if [ -d "$APP_DIR" ]; then
        echo "Creating full application backup..."
        tar -czf "$BACKUP_DIR/app-backup-$TIMESTAMP.tar.gz" \
            -C "$(dirname "$APP_DIR")" \
            --exclude="$(basename "$APP_DIR")/.pm2" \
            --exclude="$(basename "$APP_DIR")/node_modules/.cache" \
            --exclude="$(basename "$APP_DIR")/client/node_modules/.cache" \
            --exclude="$(basename "$APP_DIR")/logs" \
            --exclude="$(basename "$APP_DIR")/nohup.out" \
            --exclude="$(basename "$APP_DIR")/cards.db-shm" \
            --exclude="$(basename "$APP_DIR")/cards.db-wal" \
            "$(basename "$APP_DIR")"
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
    if [ "$SKIP_GIT" = true ]; then
        echo "⏭️  Skipping git operations as requested"
        return 0
    fi
    
    echo "Updating from Git repository..."
    cd "$APP_DIR"
    
    # Save current branch
    CURRENT_BRANCH=$(git branch --show-current)
    echo "Current branch: $CURRENT_BRANCH"
    
    # Check for local changes
    if [ "$FORCE_UPDATE" = true ]; then
        echo "🚨 Force update mode: handling local changes..."
        
        # Stash any local changes (including untracked files)
        echo "Stashing local changes..."
        git add -A
        git stash push -m "Auto-stash before force update $(date)"
        
        # Reset any partial merges or conflicts
        git reset --hard HEAD
        git clean -fd
        
    else
        # Check if we have local changes that would conflict
        git fetch origin
        if ! git diff --quiet HEAD origin/master 2>/dev/null && ! git diff --quiet HEAD origin/main 2>/dev/null; then
            if git status --porcelain | grep -q .; then
                echo "❌ Local changes detected that would be overwritten."
                echo "Either commit your changes, or run with --force to override."
                echo ""
                echo "Files with local changes:"
                git status --porcelain
                echo ""
                echo "To force update and backup local changes, run:"
                echo "  $0 --force"
                exit 1
            fi
        fi
    fi
    
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
    
    if [ "$FORCE_UPDATE" = true ]; then
        echo "✅ Force update completed. Local changes were stashed."
        echo "To recover stashed changes later, run: git stash pop"
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
    
    # Always run init-database.sh to ensure all tables exist with correct schema
    if [ -f "init-database.sh" ]; then
        echo "Running database initialization to ensure all tables exist..."
        chmod +x init-database.sh
        ./init-database.sh
    else
        echo "⚠️  Warning: init-database.sh not found, skipping database schema update"
    fi
    
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
    
    # Wait longer for app to fully start and become responsive
    echo "Waiting for application to fully start (30 seconds)..."
    sleep 30
    
    # Try multiple times to check if app responds
    local retries=3
    for i in $(seq 1 $retries); do
        echo "Checking application response (attempt $i/$retries)..."
        if curl -f --max-time 10 http://localhost:5000/api/version >/dev/null 2>&1; then
            echo "✅ Application is responding"
            echo "Update verification successful!"
            return 0
        else
            echo "Application not responding on attempt $i/$retries"
            if [ $i -lt $retries ]; then
                echo "Waiting 10 seconds before next attempt..."
                sleep 10
            fi
        fi
    done
    
    echo "❌ Application is not responding after $retries attempts"
    
    # Show recent PM2 logs for debugging
    echo "Recent PM2 logs:"
    pm2 logs mop-card-tracker --lines 10 --nostream
    
    return 1
}

# Function to rollback if needed
rollback() {
    echo "⚠️  Rolling back to previous version..."
    
    # Stop current application
    pm2 stop mop-card-tracker 2>/dev/null || true
    
    # Find the latest backup in the backup directory
    local latest_backup=""
    local backup_timestamp=""
    
    # Try to get backup info from the current backup directory first
    if [ -f "$BACKUP_DIR/backup-info.txt" ]; then
        backup_timestamp=$(grep "BACKUP_TIMESTAMP=" "$BACKUP_DIR/backup-info.txt" | cut -d'=' -f2)
        if [ -n "$backup_timestamp" ]; then
            latest_backup="$BACKUP_DIR/app-backup-$backup_timestamp.tar.gz"
        fi
    fi
    
    # If no specific backup found, find the most recent one
    if [ -z "$latest_backup" ] || [ ! -f "$latest_backup" ]; then
        echo "Looking for latest backup in $BACKUP_DIR..."
        latest_backup=$(find "$BACKUP_DIR" -name "app-backup-*.tar.gz" -type f -exec ls -t {} + | head -1)
    fi
    
    # If still no backup, try the global backup directory
    if [ -z "$latest_backup" ] || [ ! -f "$latest_backup" ]; then
        echo "Looking for latest backup in $HOME/mop-backups..."
        latest_backup=$(find "$HOME/mop-backups" -name "app-backup-*.tar.gz" -type f -exec ls -t {} + 2>/dev/null | head -1)
    fi
    
    if [ -n "$latest_backup" ] && [ -f "$latest_backup" ]; then
        echo "Restoring from backup: $latest_backup"
        cd "$(dirname "$APP_DIR")"
        
        # Backup the current (failed) state
        if [ -d "$APP_DIR" ]; then
            mv "$APP_DIR" "${APP_DIR}.failed-$(date +%Y%m%d_%H%M%S)"
        fi
        
        # Restore from backup
        tar -xzf "$latest_backup"
        
        # Restore database if available
        local db_backup=""
        if [ -n "$backup_timestamp" ]; then
            db_backup="$BACKUP_DIR/cards.db.backup-$backup_timestamp"
        else
            db_backup=$(find "$(dirname "$latest_backup")" -name "cards.db.backup-*" -type f -exec ls -t {} + | head -1)
        fi
        
        if [ -n "$db_backup" ] && [ -f "$db_backup" ]; then
            echo "Restoring database from: $db_backup"
            cp "$db_backup" "$APP_DIR/cards.db"
        fi
        
        # Start application
        cd "$APP_DIR"
        pm2 start ecosystem.config.js
        
        echo "✅ Rollback completed successfully"
        echo "Failed application backed up to: ${APP_DIR}.failed-$(date +%Y%m%d_%H%M%S)"
    else
        echo "❌ No backup found for rollback!"
        echo "Searched in:"
        echo "  - $BACKUP_DIR"
        echo "  - $HOME/mop-backups"
        echo ""
        echo "Available backups:"
        find "$BACKUP_DIR" "$HOME/mop-backups" -name "app-backup-*.tar.gz" -type f 2>/dev/null || echo "  No backups found"
        exit 1
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  --branch <branch>    Update to specific branch (default: current branch)"
    echo "  --master            Update to master/main branch"
    echo "  --backup-dir <dir>  Use specific backup directory (default: auto-generated)"
    echo "  --skip-git          Skip git pull (useful when already pulled)"
    echo "  --verify-only       Only verify current installation"
    echo "  --rollback          Rollback to previous backup"
    echo "  --help              Show this help message"
}

# Main update process
main() {
    echo "Starting update process..."
    
    # Run database safety check first
    if [ -f "$APP_DIR/check-database-safety.sh" ]; then
        echo "Running database safety check..."
        "$APP_DIR/check-database-safety.sh"
        echo ""
    fi
    
    # Parse command line arguments
    BRANCH=""
    VERIFY_ONLY=false
    ROLLBACK=false
    CUSTOM_BACKUP_DIR=""
    SKIP_GIT=false
    
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
            --backup-dir)
                CUSTOM_BACKUP_DIR="$2"
                shift 2
                ;;
            --skip-git)
                SKIP_GIT=true
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
    
    # Use custom backup directory if provided
    if [ -n "$CUSTOM_BACKUP_DIR" ]; then
        BACKUP_DIR="$CUSTOM_BACKUP_DIR"
        echo "Using custom backup directory: $BACKUP_DIR"
    fi
    
    # Setup required directories
    setup_directories
    
    # Stop application first to prevent file changes during backup
    stop_application
    
    # Create backup after stopping application
    create_backup
    
    # Update from git (skip if already done)
    if [ "$SKIP_GIT" = false ]; then
        if [ -n "$BRANCH" ]; then
            update_from_git "$BRANCH"
        else
            update_from_git
        fi
    else
        echo "Skipping git update (already performed)"
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
