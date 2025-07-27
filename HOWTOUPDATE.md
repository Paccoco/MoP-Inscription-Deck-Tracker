# How to Update MoP Inscription Deck Tracker

This guide provides step-by-step instructions for updating your MoP Inscription Deck Tracker installation from one version to the next.

## Table of Contents
- [Automatic Updates (Recommended)](#automatic-updates-recommended)
- [Manual Updates](#manual-updates)
- [Pre-Update Checklist](#pre-update-checklist)
- [Post-Update Verification](#post-update-verification)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)
- [Version-Specific Upgrade Notes](#version-specific-upgrade-notes)

## Automatic Updates (Recommended)

### Using the Admin Panel
1. **Access Admin Panel**: Log in as an admin user and navigate to the Admin section
2. **Check for Updates**: The system automatically checks for updates every 24 hours
3. **Review Update Information**: Check the version details, changelog, and release notes
4. **Initiate Update**: Click "Update Now" or schedule the update for a specific time
5. **Monitor Progress**: The system will show update progress and automatically restart when complete

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

## Manual Updates

### Method 1: Git Pull (Development/Source Installations)

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
git checkout main  # or the target branch
git pull origin main

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

### Common Issues

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
