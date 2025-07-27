# Mist of Pandaria Card Tracker

## Screenshots

### Homepage
![Homepage](docs/screenshots/homepage.png)

**Version: 1.1.1**

A self-hosted web app for World of Warcraft: Mist of Pandaria - Classic guilds to track Inscription Cards, complete decks, manage deck sales, payouts, and more. Built for transparency, sharing, and easy guild management.

## Major Features

- **Card & Deck Tracking:** Track all MoP Inscription cards, deck completion status, and contributors
- **User Management:** Registration, approval, roles (Admin, Officer, User), and profile management
- **Notification System:** Unified system for in-app, Discord webhook, and per-user Gotify notifications
- **Admin Panel:** User approval, deck allocation, analytics, export/import, notification config
- **Activity Logging:** Transparent logging of all major actions
- **Analytics:** Contributor leaderboard, deck fulfillment speed, card acquisition trends
- **Export/Import:** CSV-based data portability for cards and decks (admin only)
- **Responsive UI:** Mobile-friendly, MoP-themed interface
- **Auto-Update System:** Automated version checking, scheduled updates, and rollback capabilities
- **Update Management:** Comprehensive admin tools for system updates with backup and recovery

For detailed changes and bug fixes, please refer to the [CHANGELOG.md](CHANGELOG.md) file.

## Release Notes: Version 1.1.0 (2025-07-27)

### Major New Features
- **Automated Update System:** Built-in version checking and update management
- **Scheduled Updates:** Plan system updates for specific times with automatic execution
- **Backup & Recovery:** Automated backup creation and rollback capabilities
- **Update Guide:** Comprehensive `HOWTOUPDATE.md` with step-by-step upgrade procedures
- **Enhanced Admin Tools:** Real-time update monitoring and system management

### Technical Improvements
- Fixed critical database connection issues causing API failures
- Improved error handling and database operation reliability
- Enhanced SQLite configuration with WAL mode and foreign key support
- Resolved frontend build and static file serving problems

## Previous Major Release: Version 1.0.0 (2025-07-26)

### Major Features & Improvements
- Initial stable release of MoP Inscription Deck Tracker
- Complete card and deck tracking functionality
- Fully functional user authentication with JWT
- Admin panel with comprehensive user management
- Discord webhook integration for notifications
- Gotify notification support for personalized alerts

## Features
- Track all Mist of Pandaria Inscription Cards
- Grid and summary views for cards and decks
- Wowhead tooltips for trinkets in Deck Status
- Mobile-friendly, responsive design
- Dark mode and MoP-themed visuals
- Add/remove cards and owners
- SQLite database for persistent storage
- React frontend, Express backend
- Easy deployment and auto-start script
- Admin panel for user approval, deck allocation, and role management
- Completed Decks page with disposition, sale price, and payout information
- Admin Announcement Modal for important guild communications
- Notifications for approvals, deck completions, payouts, and more
- User Profile with personal cards, completed decks, and notification settings
- Discord Integration for automated guild notifications
- Gotify Notifications for personalized alerts

## Tech Stack
- Node.js + Express.js (backend)
- React (frontend)
- SQLite (database)
- Chart.js (analytics)

## System Requirements
- **OS**: Ubuntu 20.04+ or Debian 11+ (script supports APT package manager)
- **RAM**: 1GB minimum (2GB recommended, script adds swap if needed)
- **Disk**: 5GB minimum (10GB recommended for logs and backups)
- **Network**: Public IP with domain name for SSL certificates

## Setup & Installation

### Quick Install (Recommended)
```bash
git clone https://github.com/Paccoco/MoP-Inscription-Deck-Tracker.git
cd MoP-Inscription-Deck-Tracker
./install.sh
```

### Production Server Deployment (Complete Setup)
For a full production deployment with Nginx, SSL, firewall, and monitoring:
```bash
# 1. Clone the repository
git clone https://github.com/Paccoco/MoP-Inscription-Deck-Tracker.git
cd MoP-Inscription-Deck-Tracker

# 2. Edit deployment configuration
sudo nano deploy-production.sh
# Change DOMAIN="your-domain.com" to your actual domain

# 3. Run the production deployment script
sudo ./deploy-production.sh
```

**The production script automatically sets up:**
- ✅ Dedicated app user and secure file permissions
- ✅ Complete system dependencies (Node.js LTS, PM2, Nginx, SQLite, Redis)
- ✅ Development tools (build-essential, Python3, TypeScript, Yarn)
- ✅ Security tools (fail2ban, UFW firewall, SSL certificates)
- ✅ System utilities (htop, tree, nano, vim, rsync, cron)
- ✅ Application deployment and build process
- ✅ Secure environment configuration with random passwords
- ✅ Nginx reverse proxy with SSL certificates (Let's Encrypt)
- ✅ Advanced firewall configuration with fail2ban protection
- ✅ PM2 process management with auto-restart and monitoring
- ✅ System optimization (log rotation, swap, security updates)
- ✅ Health monitoring with automated recovery (5-minute intervals)
- ✅ Backup directories and comprehensive logging setup

### Manual Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Paccoco/MoP-Inscription-Deck-Tracker.git
   cd MoP-Inscription-Deck-Tracker
   ```

2. **Install PM2 (Process Manager):**
   ```bash
   npm install -g pm2
   ```

3. **Install dependencies:**
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

4. **Build the React frontend:**
   ```bash
   cd client && npm run build && cd ..
   ```

5. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env file with your settings
   ```

6. **Start with PM2:**
   ```bash
   ./start-card-tracker.sh
   ```
   Or manually:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   ```

7. **Access the app:**
   Open your browser and go to `http://localhost:5000` (or your server's IP/domain).

### System Service Setup
The installation script automatically sets up a systemd service for auto-start on boot:
```bash
sudo systemctl status cardtracker
sudo systemctl start cardtracker
sudo systemctl stop cardtracker
```

## Updating

### Automatic Updates (Via Admin Panel)
1. Log in as admin
2. Navigate to Admin > System Updates
3. Check for available updates
4. Click "Update Now" or schedule for later

### Manual Updates
```bash
# Simple update to latest version
./update.sh

# Update to specific branch
./update.sh --branch master

# Update to master branch
./update.sh --master

# Verify installation only
./update.sh --verify-only

# Rollback if needed
./update.sh --rollback
```

For detailed update procedures, see [HOWTOUPDATE.md](HOWTOUPDATE.md).

## Process Management

### PM2 Commands
```bash
# Check application status
pm2 status

# View application logs
pm2 logs mop-card-tracker

# Restart application
pm2 restart mop-card-tracker

# Stop application
pm2 stop mop-card-tracker

# Monitor resources
pm2 monit

# Save PM2 configuration
pm2 save

# Setup auto-start on boot
pm2 startup
```

### Systemd Service Commands
```bash
# Check service status
sudo systemctl status cardtracker

# Start/stop service
sudo systemctl start cardtracker
sudo systemctl stop cardtracker

# Enable/disable auto-start
sudo systemctl enable cardtracker
sudo systemctl disable cardtracker

# View service logs
journalctl -u cardtracker -f
```

### Production Server Management
For production deployments using `deploy-production.sh`:
```bash
# Application management (as the app user)
sudo -u mop-tracker pm2 status
sudo -u mop-tracker pm2 logs mop-card-tracker
sudo -u mop-tracker pm2 restart mop-card-tracker

# Nginx management
sudo systemctl status nginx
sudo nginx -t                    # Test configuration
sudo systemctl reload nginx     # Reload after config changes

# SSL certificate renewal (automatic via cron)
sudo certbot renew --dry-run    # Test renewal
sudo systemctl status certbot.timer

# Firewall management
sudo ufw status                  # Check firewall status
sudo ufw allow from [IP]         # Allow specific IP

# Health monitoring
sudo tail -f /opt/mop-card-tracker/logs/health.log

# View admin credentials
sudo cat /opt/mop-card-tracker/.env
```

## Discord & Gotify Integration
- Configure Discord webhook and Gotify server/token in the Admin Panel.
- Each user can configure their own Gotify server and token in their profile, and select which notification types they want to receive.
- Automated notifications for deck completions, sales, requests, admin approvals, and new user registrations (admin only).

## How To Use
### For All Users
- **Register:** Create an account and wait for admin approval
- **Login:** Access your account once approved
- **Track Cards:** Add/remove cards you own on the Card Tracker page
- **View Deck Progress:** See grid/summary views and Wowhead trinket tooltips. Completed decks are highlighted
- **Completed Decks:** View all completed decks, their disposition, sale price, payout split, and estimated value
- **Notifications:** View in-app notifications for approvals, deck completions, payouts, requests, and (for admins) new user registrations
- **Deck Requests:** Request specific decks and track their fulfillment status
- **Activity Log:** View recent actions (card added/removed, deck completed/sold) for transparency
- **Profile:** View your cards, completed decks, payouts, recent activity, and configure Gotify notifications
- **Analytics:** View charts for deck completion rates, contributor stats, and payout trends
- **Card/Deck History:** View timeline/history for each card and deck

### For Admins/Officers
- **Approve Users:** Review and approve new registrations (receive notification for new user needing approval)
- **Allocate Completed Decks:** Select from completed/unallocated decks and view estimated deck value
- **Notifications:** Users are notified automatically for approvals, deck completions, payouts, requests, and new user registrations
- **Export/Import:** Export/import all card/deck data to CSV (**admin panel only**)
- **Activity Log:** View recent actions for all users for transparency
- **Role Management:** Assign roles (Admin, Officer, User)
- **Analytics:** View deck completion rates, contributor stats, and payout history
- **Discord & Gotify Integration:** Configure Discord webhook for automated notifications, and set up Gotify for guild-wide or personal notifications
- **User Removal:** Remove user access directly from the Admin panel

## API Endpoints
- `/api/cards` - Get/add/delete cards
- `/api/completed-decks` - Get/add completed decks
- `/api/admin/completed-unallocated-decks` - Get completed decks not yet allocated
- `/api/admin/approve` - Approve users
- `/api/notifications` - Get notifications for logged-in user
- `/api/notifications/read` - Mark notification as read
- `/api/deck-requests` - Get/add deck requests
- `/api/export/cards` - Export all cards as CSV (**admin only**)
- `/api/export/decks` - Export all completed decks as CSV (**admin only**)
- `/api/activity` - Get recent activity log
- `/api/activity/all` - Get recent activity log for all users (**admin only**)
- `/api/profile` - Get user profile info
- `/api/gotify/config` - Configure Gotify server/token and notification types (per user)
- `/api/analytics` - Get analytics dashboard data
- `/api/cards/:id/history` - Get card history
- `/api/decks/:id/history` - Get deck history
- `/api/discord/webhook` - Configure Discord webhook for notifications

## Automated Dependency Updates
This repository uses **Dependabot** for automated dependency updates:
- Weekly checks for outdated or vulnerable dependencies
- Automated pull requests for updates
- CI runs security and test checks before merging

## Troubleshooting

### Quick Diagnosis
Run the diagnostic script to identify common setup issues:
```bash
./diagnose.sh
```
This will check your installation for missing files, wrong paths, and configuration issues.

### Common Issues
- **Path errors**: Ensure you're running scripts from the correct directory (MoP-Inscription-Deck-Tracker)
- **Missing logs directory**: Run `mkdir -p logs` if PM2 fails to start
- **Wrong PM2 process name**: Use `mop-card-tracker` (not `mop-inscription-tracker`)
- **Environment file**: Copy `.env.example` to `.env` and configure your settings
- **Notifications**: Check your Gotify/Discord config and ensure your server is running
- **Mobile issues**: Ensure your browser is up to date and try resizing the window
- **Export/import problems**: Verify CSV format and file encoding
- **Login issues**: Check browser console and server logs for more details

For detailed troubleshooting, see [HOWTOUPDATE.md](HOWTOUPDATE.md).
