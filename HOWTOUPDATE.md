# How to Update MoP Inscription Deck Tracker

This guide provides step-by-step instructions for updating your MoP Inscription Deck Tracker installation from one version to the next.

## 🚨 CRITICAL UPDATE NOTICES

### Latest Critical Fix - v1.2.5 (2025-07-28)

**RESOLVED: Production Update Failures**

If your production server was failing to update with "admins is not iterable" error, version 1.2.5 completely resolves this issue.

#### ⚠️ IMMEDIATE FIX AVAILABLE:
```bash
# For production servers experiencing update failures:
./force-update.sh

# If you encounter package-lock.json conflicts:
rm -f package-lock.json client/package-lock.json node_modules/.package-lock.json
git reset --hard HEAD
./force-update.sh
```

#### What Was Fixed in v1.2.5:
- ✅ **CRITICAL**: Fixed "admins is not iterable" error causing update crashes
- ✅ Enhanced package-lock.json conflict resolution in force-update script
- ✅ Added proper null checks for database queries during updates
- ✅ Improved error handling for admin notification systems
- ✅ Production servers can now safely update without database-related crashes

### Previous Critical Notice - v1.1.3

**READ THIS FIRST BEFORE UPDATING!**

### Production Deployment Guide Available
**For comprehensive production server deployment and update procedures, see [PRODUCTION-DEPLOYMENT.md](PRODUCTION-DEPLOYMENT.md).**

### Database Schema Fixes Required - "Failed to load admin data" Issue
If you're experiencing "Failed to load admin data" errors on your admin panel, this update completely resolves the issue.

#### ⚠️ IMMEDIATE ACTION REQUIRED:
```bash
# 1. CRITICAL: Update to latest scripts and initialize database
git pull origin master
./init-database.sh

# 2. Restart application
pm2 restart mop-card-tracker

# 3. Verify admin panel loads correctly
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/admin/completed-unallocated-decks
```

#### Why This Is Critical:
- **Root Cause**: Missing `completed_decks` table and schema mismatches cause admin panel failures
- **Impact**: Admin panel shows "Failed to load admin data" preventing administrative functions
- **Solution**: Updated database initialization scripts create missing tables with correct schemas
- **Safety**: 100% safe - no existing data will be lost, only missing tables added

#### What Gets Fixed:
- ✅ Creates missing `completed_decks` table with correct schema (deck, contributors, completed_at, disposition, recipient)
- ✅ Adds missing tables: `scheduled_updates`, proper `gotify_config`, etc.
- ✅ Fixes schema mismatches between init scripts and server expectations
- ✅ Resolves "Failed to load admin data" for all admin users
- ✅ All production deployment scripts now verified and production-ready

**This must be run BEFORE proceeding with any update commands below.**

---

## Table of Contents
- [🚨 CRITICAL UPDATE NOTICE - v1.1.2](#-critical-update-notice---v112)
- [Automatic Updates (Recommended)](#automatic-updates-recommended)
- [Manual Updates](#manual-updates)
- [Pre-Update Checklist](#pre-update-checklist)
- [Post-Update Verification](#post-update-verification)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)
- [Version-Specific Upgrade Notes](#version-specific-upgrade-notes)

## Automatic Updates (Recommended)

**📖 For production server updates, also see [PRODUCTION-DEPLOYMENT.md](PRODUCTION-DEPLOYMENT.md) for comprehensive deployment procedures.**

### Using the Admin Panel
1. **Access Admin Panel**: Log in as an admin user and navigate to the Admin section
2. **Manual Version Check**: Click "Check for Updates" button for immediate update availability check
3. **Automatic Checks**: The system automatically checks for updates every 24 hours
4. **Review Update Information**: Check the version details, changelog, and release notes
5. **Initiate Update**: Click "Update Now" or schedule the update for a specific time
6. **Monitor Progress**: The system will show update progress and automatically restart when complete

### Quick Production Update
```bash
# For existing production servers (recommended method)
git pull origin master
./update.sh
```

### Scheduled Updates
```bash
# Schedule an update for a specific time via API
curl -X POST http://localhost:5000/api/admin/update/schedule \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.2.0",
    "scheduledTime": "2025-07-28T02:00:00.000Z"
  }'
```

> **Note**: As of version 1.1.1, the update system automatically handles:
> - Creation of required directories (logs, backups)
> - Environment file setup (.env from .env.example)
> - Directory permissions
> - PM2 log directory initialization

## Manual Updates

> **⚠️ IMPORTANT**: Before running any manual update commands, ensure you have completed the [Critical Database Fix](#-critical-update-notice---v113) if updating to v1.1.3 or later.

**📖 For production environments, see [PRODUCTION-DEPLOYMENT.md](PRODUCTION-DEPLOYMENT.md) for detailed production-specific procedures.**

### Method 1: Using Update Script (Recommended)

```bash
# Simple one-command update for existing installations
git pull origin master
./update.sh
```

The update script automatically:
- ✅ Runs database initialization to ensure all tables exist
- ✅ Installs dependencies and builds frontend
- ✅ Handles schema updates and missing tables
- ✅ Restarts PM2 process
- ✅ Preserves all existing data

### Method 2: Git Pull (Development/Source Installations)

```bash
# 1. Stop the application
pm2 stop mop-card-tracker

# 2. Backup current installation
cp -r /home/paccoco/MoP-Inscription-Deck-Tracker /home/paccoco/MoP-Inscription-Deck-Tracker-backup-$(date +%Y%m%d_%H%M%S)

# 3. Backup database
cp /home/paccoco/MoP-Inscription-Deck-Tracker/cards.db /home/paccoco/MoP-Inscription-Deck-Tracker/cards.db.backup-$(date +%Y%m%d_%H%M%S)

# 4. Pull latest changes
cd /home/paccoco/MoP-Inscription-Deck-Tracker
git fetch origin
git checkout master  # or the target branch
git pull origin master

# 5. Update dependencies
npm install
cd client && npm install && cd ..

# 6. Rebuild frontend
cd client && npm run build && cd ..

# 7. Run database migrations (if any)
node scripts/migrate.js  # if migration script exists

# 8. Restart application
pm2 restart mop-card-tracker

# 9. Verify update
pm2 logs mop-card-tracker --lines 50
```

### Method 2: Release Download

```bash
# 1. Stop the application
pm2 stop mop-card-tracker

# 2. Backup current installation
cp -r /home/paccoco/MoP-Inscription-Deck-Tracker /home/paccoco/MoP-Inscription-Deck-Tracker-backup-$(date +%Y%m%d_%H%M%S)

# 3. Download and extract new version
cd /tmp
wget https://github.com/Paccoco/MoP-Inscription-Deck-Tracker/archive/refs/tags/v1.2.0.tar.gz
tar -xzf v1.2.0.tar.gz

# 4. Preserve important files
cp /home/paccoco/MoP-Inscription-Deck-Tracker/cards.db /tmp/cards.db.backup
cp /home/paccoco/MoP-Inscription-Deck-Tracker/.env /tmp/.env.backup

# 5. Replace installation
rm -rf /home/paccoco/MoP-Inscription-Deck-Tracker
mv MoP-Inscription-Deck-Tracker-1.2.0 /home/paccoco/MoP-Inscription-Deck-Tracker

# 6. Restore important files
cp /tmp/cards.db.backup /home/paccoco/MoP-Inscription-Deck-Tracker/cards.db
cp /tmp/.env.backup /home/paccoco/MoP-Inscription-Deck-Tracker/.env

# 7. Install dependencies and build
cd /home/paccoco/MoP-Inscription-Deck-Tracker
npm install
cd client && npm install && npm run build && cd ..

# 8. Restart application
pm2 restart mop-card-tracker
```

## Pre-Update Checklist

### Database Safety Verification
**🔐 CRITICAL: Always verify database protection before updating**

```bash
# Run database safety check
./check-database-safety.sh

# Verify database files are protected
ls -la cards.db*  # Should show existing database files
cat .gitignore    # Should exclude *.db files
```

**Key Safety Confirmations:**
- ✅ Database files (*.db) are in .gitignore
- ✅ Production data exists and will be preserved
- ✅ Backups will be created automatically
- ✅ Only table structure will be updated, not data

### Standard Pre-Update Steps

### Essential Backups
- [ ] **Database Backup**: `cp cards.db cards.db.backup-$(date +%Y%m%d_%H%M%S)`
- [ ] **Environment File**: `cp .env .env.backup`
- [ ] **Full Application Backup**: `cp -r /path/to/app /path/to/app-backup-$(date +%Y%m%d_%H%M%S)`
- [ ] **PM2 Ecosystem**: `pm2 save` (if using PM2)

### System Requirements Check
- [ ] **Node.js Version**: Ensure compatible Node.js version (check package.json engines)
- [ ] **Available Disk Space**: At least 1GB free space for update process
- [ ] **Memory**: Ensure sufficient RAM for build process
- [ ] **Permissions**: Verify write permissions to application directory

### Pre-Update Actions
- [ ] **Notify Users**: Inform users of planned downtime
- [ ] **Stop Background Jobs**: Ensure no ongoing processes
- [ ] **Export Data**: Consider exporting critical data via Admin panel
- [ ] **Document Current State**: Note current version, active features, custom configurations

## Post-Update Verification

### Functional Tests
```bash
# 1. Check application startup
pm2 logs mop-card-tracker --lines 20

# 2. Verify database connection
curl http://localhost:5000/api/version

# 3. Test authentication
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

# 4. Check API endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/cards

# 5. Verify frontend
curl http://localhost:5000/
```

### Post-Update Checklist
- [ ] **Version Confirmation**: Check version number in Admin panel
- [ ] **Database Integrity**: Verify all data is present and accessible
- [ ] **User Authentication**: Test login functionality
- [ ] **Core Features**: Test card tracking, deck management, admin functions
- [ ] **Notifications**: Verify Discord/Gotify notifications work
- [ ] **Performance**: Check response times and resource usage

## Rollback Procedures

### Automatic Rollback (Via Admin Panel)
1. Navigate to Admin > System Updates
2. Find the problematic update entry
3. Click "Rollback" button
4. Confirm rollback operation
5. Monitor system restart

### Manual Rollback
```bash
# 1. Stop current application
pm2 stop mop-card-tracker

# 2. Restore from backup
rm -rf /home/paccoco/MoP-Inscription-Deck-Tracker
cp -r /home/paccoco/MoP-Inscription-Deck-Tracker-backup-YYYYMMDD_HHMMSS /home/paccoco/MoP-Inscription-Deck-Tracker

# 3. Restore database
cp /home/paccoco/MoP-Inscription-Deck-Tracker/cards.db.backup-YYYYMMDD_HHMMSS /home/paccoco/MoP-Inscription-Deck-Tracker/cards.db

# 4. Restart application
pm2 restart mop-card-tracker

# 5. Verify rollback
pm2 logs mop-card-tracker --lines 20
```

## Troubleshooting

### Quick Diagnosis Tool
Before troubleshooting manually, run the diagnostic script to identify common issues:
```bash
./diagnose.sh
```
This script will check:
- Directory structure and required files
- Node.js and PM2 setup
- Git repository status
- System permissions
- Environment configuration

### Common Issues

#### Path and Directory Issues
**Symptoms**: `ENOENT: no such file or directory` errors, PM2 fails to start

**Solutions**:
```bash
# Verify you're in the correct directory
pwd
ls -la package.json  # Should show the main package.json

# Create missing directories
mkdir -p logs
touch logs/.gitkeep

# Fix PM2 process name if using old references
pm2 delete mop-inscription-tracker  # old name
pm2 start ecosystem.config.js       # correct configuration

# Auto-detect and fix paths (new feature in v1.1.1)
./update.sh  # Now automatically detects the correct project directory
```

#### Missing Directories or Environment Files
```bash
# Create required logs directory
mkdir -p logs
touch logs/.gitkeep

# Setup .env file from example
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp ".env.example" ".env"
    echo "Please edit .env file with your configuration"
fi

# Fix PM2 log directory permissions
chmod 755 logs
```

#### Database Migration Errors
```bash
# Check database schema
sqlite3 cards.db ".schema"

# Check for missing tables
sqlite3 cards.db "SELECT name FROM sqlite_master WHERE type='table';"

# Manual schema update (example)
sqlite3 cards.db "ALTER TABLE users ADD COLUMN new_field TEXT DEFAULT NULL;"
```

#### Permission Errors
```bash
# Fix file permissions
chown -R $USER:$USER /home/paccoco/MoP-Inscription-Deck-Tracker
chmod -R 755 /home/paccoco/MoP-Inscription-Deck-Tracker
```

#### NPM/Build Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear React build cache
rm -rf client/node_modules client/build
cd client && npm install && npm run build
```

#### Package-lock.json Conflicts (v1.2.5+ Fix)
If you encounter package-lock.json conflicts during updates:
```bash
# Method 1: Use the enhanced force-update script
./force-update.sh

# Method 2: Manual cleanup and update
rm -f package-lock.json client/package-lock.json node_modules/.package-lock.json
git reset --hard HEAD
git pull origin main
./update.sh

# Method 3: Complete reset (last resort)
git stash push -u -m "backup before reset"
git reset --hard origin/main
npm install
cd client && npm install && cd ..
./update.sh
```

#### "admins is not iterable" Error (Fixed in v1.2.5)
This error occurred during updates when admin notification queries failed:
```bash
# Symptoms:
# - Update process crashes with "admins is not iterable" 
# - Application fails to start after update
# - Rollback system activates

# Solution (Fixed in v1.2.5):
./force-update.sh  # Will now handle this error automatically

# If still experiencing issues:
git pull origin main
./force-update.sh
```

#### PM2 Issues
```bash
# Restart PM2
pm2 kill
pm2 start server-auth.js --name mop-card-tracker

# Check PM2 status
pm2 status
pm2 logs mop-card-tracker
```

### Logs and Debugging
```bash
# Application logs
pm2 logs mop-card-tracker --lines 100

# System logs
journalctl -u cardtracker.service -f

# Database logs
tail -f /var/log/sqlite.log  # if logging enabled
```

## Version-Specific Upgrade Notes

### ✅ v1.2.5 - Critical Production Update Fix (2025-07-28)
**CRITICAL**: This version fixes production server update failures.

- **Main Fix**: Resolved "admins is not iterable" error causing update crashes
- **Enhanced**: Package-lock.json conflict resolution in force-update script
- **Database Safety**: Added proper null checks for admin notification queries
- **Production Impact**: Servers that couldn't update to v1.2.4 can now safely update
- **Rollback Protection**: Enhanced rollback system handles more failure scenarios

**Update Command:**
```bash
./force-update.sh  # Recommended for production servers
# OR
./update.sh --force
```

### ✅ v1.2.4 - Production Update Reliability (2025-07-28)
- **Enhanced**: Extended verification timeout from 5 to 30 seconds
- **Improved**: Backup and rollback system with better tracking
- **Added**: Health check script for diagnosing startup issues
- **Fixed**: ESLint warnings across React components

### ✅ v1.1.2 Database Fix (Covered Above)
See the [Critical Update Notice](#-critical-update-notice---v112) at the top of this document for required database initialization steps.

### Upgrading to v1.2.0
- **New Features**: Enhanced notification system, security dashboard
- **Database Changes**: New tables for `system_updates`, `update_checks`, `scheduled_updates`
- **Dependencies**: Updated to Node.js 16+ requirement
- **Configuration**: New environment variables for update system

### Upgrading to v1.1.0
- **New Features**: Gotify integration, announcement system
- **Database Changes**: Added `gotify_config`, `announcement` tables
- **Dependencies**: Added `node-fetch` dependency
- **Configuration**: Optional Gotify server configuration

### Upgrading from v1.0.x to v1.1.x
```bash
# Additional migration steps for v1.1.x
sqlite3 cards.db "CREATE TABLE IF NOT EXISTS gotify_config (
    username TEXT PRIMARY KEY,
    server TEXT,
    token TEXT,
    types TEXT
);"

sqlite3 cards.db "CREATE TABLE IF NOT EXISTS announcement (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    expiry DATETIME,
    links TEXT,
    active INTEGER DEFAULT 1
);"
```

## Support and Recovery

### Emergency Contacts
- **Project Repository**: https://github.com/Paccoco/MoP-Inscription-Deck-Tracker
- **Issues**: Create a GitHub issue with logs and error details
- **Discord**: [Your Discord Server Link]

### Data Recovery
```bash
# Recover from WAL files
sqlite3 cards.db ".recover"

# Check database integrity
sqlite3 cards.db "PRAGMA integrity_check;"

# Backup before any recovery attempts
cp cards.db cards.db.pre-recovery-backup
```

### Health Check Script
```bash
#!/bin/bash
# health-check.sh
echo "=== MoP Card Tracker Health Check ==="
echo "PM2 Status:"
pm2 list | grep mop-card-tracker

echo -e "\nApplication Response:"
curl -s http://localhost:5000/api/version | jq .

echo -e "\nDatabase Tables:"
sqlite3 cards.db "SELECT name FROM sqlite_master WHERE type='table';" | wc -l

echo -e "\nDisk Space:"
df -h /home/paccoco/MoP-Inscription-Deck-Tracker

echo "=== Health Check Complete ==="
```

---

**Important**: Always test updates in a development environment before applying to production. Keep regular backups and ensure you have a rollback plan before starting any update process.
