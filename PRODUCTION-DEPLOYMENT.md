# Production Deployment Guide

## Overview

This guide covers deploying MoP Inscription Deck Tracker v1.1.3+ to production servers. All scripts have been verified and updated to handle the complete database schema and new features.

## Critical Updates for v1.1.3

### ⚠️ Important Database Changes
- **New table**: `completed_decks` with correct schema (deck, contributors, completed_at, disposition, recipient)
- **Fixed schema mismatches** between init scripts and server expectations
- **Added missing tables**: `scheduled_updates`, proper `gotify_config`, etc.

### Scripts Updated
- ✅ `init-database.sh` - Fixed schema mismatches and added missing tables
- ✅ `install.sh` - Now properly calls database initialization
- ✅ `update.sh` - Always runs database schema updates during updates
- ✅ `init-production-database.js` - Added all missing tables with correct schemas

## New Server Deployment

### Option 1: Fresh Installation Script (Recommended)
```bash
# Clone repository
git clone https://github.com/Paccoco/MoP-Inscription-Deck-Tracker.git
cd MoP-Inscription-Deck-Tracker

# Run comprehensive installation
sudo ./install.sh
```

### Option 2: Manual Production Deployment
```bash
# For production with nginx, systemd, etc.
sudo ./deploy-production.sh
```

### Option 3: Manual Setup
```bash
# 1. Install dependencies
npm install
cd client && npm install && npm run build && cd ..

# 2. Initialize database
./init-database.sh

# 3. Setup environment
cp .env.example .env
# Edit .env with your settings

# 4. Start with PM2
pm2 start ecosystem.config.js
```

## Updating Existing Servers

### For Servers Running v1.1.2 or Earlier
```bash
# Critical: This will fix database schema issues
git pull origin master
./update.sh
```

The update script now:
- ✅ Always runs `init-database.sh` to ensure all tables exist
- ✅ Handles schema updates automatically
- ✅ Preserves existing data
- ✅ Creates backups before updates

### Manual Database Fix (If Needed)
If you encounter "Failed to load admin data" errors:
```bash
# Backup current database
cp cards.db cards.db.backup

# Run database initialization
./init-database.sh

# Restart application
pm2 restart mop-card-tracker
```

## Database Schema Verification

### Check Required Tables
```bash
sqlite3 cards.db ".tables"
```

Should show:
```
activity         cards            decks            system_updates 
activity_log     completed_decks  discord_webhook  update_checks  
announcement     deck_requests    notifications    users
gotify_config    scheduled_updates
```

### Verify Critical Table Schema
```bash
sqlite3 cards.db ".schema completed_decks"
```

Should show:
```sql
CREATE TABLE completed_decks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deck TEXT NOT NULL,
  contributors TEXT,
  completed_at TEXT,
  disposition TEXT,
  recipient TEXT
);
```

## Common Issues and Solutions

### 1. "Failed to load admin data" Error
**Cause**: Missing `completed_decks` table
**Solution**: 
```bash
./init-database.sh
pm2 restart mop-card-tracker
```

### 2. "Admin access required" for Version Check
**Cause**: Authentication issue (fixed in v1.1.3)
**Solution**: Update to v1.1.3+

### 3. Missing Tables on Fresh Install
**Cause**: Old version of `init-database.sh`
**Solution**: Ensure you're using v1.1.3+ scripts

## Environment Variables

Required `.env` variables:
```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Security
JWT_SECRET=your-secure-secret-here

# Admin Account (optional, for automatic setup)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-password

# Discord Integration (optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

## Testing Production Deployment

Run the verification script:
```bash
./test-production-scripts.sh
```

This will verify:
- ✅ All required scripts exist and are executable
- ✅ Database initialization scripts are valid
- ✅ Package.json is valid
- ✅ Client build directory exists
- ✅ Environment configuration is ready

## New Features in v1.1.3

### Manual Version Check
- Admin panel now has "Check for Updates" button
- Provides immediate feedback on update availability
- Logs all manual version checks in activity log

### Fixed Admin Panel
- Resolved "Failed to load admin data" error
- All admin dashboard data now loads correctly
- Enhanced error handling and recovery

## Migration Notes

### From v1.1.2 to v1.1.3
- **Database**: Automatic schema updates via `update.sh`
- **No manual intervention required**
- **Backward compatible**: Existing data preserved

### From v1.1.1 or Earlier
- **Critical**: Run `./init-database.sh` after update
- **Recommended**: Test admin panel functionality
- **Verify**: All admin endpoints load correctly

## Support and Troubleshooting

### Logs
```bash
# PM2 logs
pm2 logs mop-card-tracker

# System logs (if using systemd)
journalctl -u cardtracker

# Manual check
curl http://localhost:5000/api/version
```

### Database Backup
```bash
# Create backup
cp cards.db cards.db.backup-$(date +%Y%m%d_%H%M%S)

# Restore from backup
cp cards.db.backup-TIMESTAMP cards.db
```

### Reset Database (Last Resort)
```bash
# DANGER: This will delete all data
rm cards.db
./init-database.sh
# Re-create admin user
node update-admin-password.js
```

## Version History

- **v1.1.3**: Fixed database schema issues, added manual version check
- **v1.1.2**: Database safety system, critical production fixes
- **v1.1.1**: Auto-update system, scheduled updates
- **v1.1.0**: Enhanced admin panel, security features
