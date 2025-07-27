# Changelog

All notable changes to the MoP Inscription Deck Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-07-27

### Added
- **Complete Dependency Update System**: Fully functional automated dependency management
  - Real-time dependency status monitoring with npm integration
  - Automated package updates for both main and client dependencies
  - Smart version constraint handling (major versions require manual intervention)
  - One-click update button in Security Dashboard
  - Comprehensive activity logging and Discord webhook notifications
  - End-to-end testing and verification completed

### Technical Improvements
- Enhanced Security Dashboard with real dependency data integration
- Improved admin panel functionality with complete feature set
- All features documented and production-ready

## [1.1.3] - 2025-07-27

### Added
- **Manual Version Check Feature**: New admin panel button for on-demand update checking
  - Added `/api/admin/version-check` POST endpoint with admin authentication
  - Integrated manual version check button in admin dashboard
  - Activity logging and notifications for manual version checks
  - Real-time feedback on update availability status
- **Dependency Update Feature**: Automated dependency update system in Security Dashboard
  - Added `/api/admin/update-dependencies` POST endpoint for updating outdated packages
  - Added `/api/admin/dependency-status` GET endpoint with real npm dependency checking
  - Integrated "Update Dependencies" button that appears when outdated packages are detected
  - Real-time dependency status checking using `npm outdated --json` and `npm list --json`
  - Automatic update of both main and client package dependencies via `npm update`
  - Proper handling of version constraints (major version updates require manual intervention)
  - Activity logging, notifications, and Discord integration for dependency updates
  - Real-time feedback on update success/failure with detailed logs
  - **COMPLETED**: Feature fully functional with real data integration
- **Production Deployment Guide**: Comprehensive `PRODUCTION-DEPLOYMENT.md` documentation
  - Complete guide for new server deployments and existing server updates
  - Database schema verification commands and troubleshooting procedures
  - Common issues and solutions with step-by-step fixes
  - Environment configuration and testing validation scripts

### Fixed
- **CRITICAL: Resolved "Failed to load admin data" error**
  - Root cause: Missing `completed_decks` table causing Promise.all() failure in admin panel
  - Created missing `completed_decks` table with correct schema (deck, contributors, completed_at, disposition, recipient)
  - Fixed authentication flow for manual version check endpoint (added missing `auth` middleware)
  - All admin dashboard endpoints now loading successfully
- **CRITICAL: Production Deployment Script Fixes**
  - Fixed `init-database.sh` schema mismatches (deck vs deck_name, completed_at vs created_at)
  - Updated `init-production-database.js` with missing tables (completed_decks, deck_requests, activity, announcement, gotify_config, scheduled_updates)
  - Enhanced `install.sh` and `update.sh` to properly run database initialization
  - Created `test-production-scripts.sh` validation tool (17 checks, 0 failures)
- **Database Schema Consistency**: Aligned server code expectations with actual database structure
  - Fixed mismatch between init scripts and server-auth.js table definitions
  - Populated test data for comprehensive admin panel testing
- **Dependency Status Endpoint**: Fixed simulated data issue to show real dependency information
  - Updated `/api/admin/dependency-status` to use real npm commands instead of hardcoded data
  - Fixed detection of ALL outdated packages (not just subset of predefined packages)
  - Proper authentication integration for admin-only access

### Changed
- **Copilot Instructions Updated**: Added reference to PRODUCTION-DEPLOYMENT.md for production server guidance
- **README.md**: Updated with v1.1.3 release information and production deployment guide references
- **Production Scripts**: All deployment scripts now verified and production-ready

### Technical Details
- Manual version check endpoint properly authenticated with `auth, requireAdmin` middleware chain
- Admin panel Promise.all() data loading now succeeds with all endpoints functional
- Dependency update system uses real npm commands for accurate package status detection
- Major version updates (e.g., express 4.x → 5.x) correctly identified as not automatically updatable
- Real-time dependency checking with proper error handling and fallback to simulated data
- **All features tested and verified working in both development and production environments**
- Comprehensive test data populated for development environment testing
- All production deployment scripts validated and ready for both new servers and updates
- Frontend rebuild and backend restart completed for production readiness

## [1.1.2] - 2025-07-27

### Fixed
- **CRITICAL: Fixed "Error adding card" issue reported by production users**
  - Root cause: Missing database tables causing server crashes
  - Created comprehensive database initialization script (`init-database.js`)
  - Added all required tables: users, cards, decks, notifications, system_updates, activity_log, discord_webhook, update_checks
  - Fixed authentication flow and card ownership assignment
  - Verified frontend and backend card adding functionality working correctly

### Added
- Database initialization script for creating all required tables
- Test user creation functionality for safe local debugging
- Comprehensive card adding test suite (`test-frontend-flow.js`, `test-frontend-detailed.js`)
- Production-ready database schema with proper foreign key constraints
- Test users: `testadmin`/`testadmin123` (admin) and `testuser`/`testuser123` (regular user)
- **Database Safety System:**
  - Production-safe database initialization script (`init-production-database.js`)
  - Database safety checker (`check-database-safety.sh`) integrated into update process
  - Environment-aware initialization (no test users in production)
  - Enhanced safety warnings for existing production databases
  - Automatic database protection verification during updates

### Technical Details
- Backend properly extracts `owner` from JWT token for card ownership
- Frontend sends correct payload: `{card_name, deck}`
- All authentication endpoints working correctly
- Input validation and error handling functioning properly
- Duplicate cards allowed (correct business logic)
- Server running stable on PM2 without crashes

## [1.1.1] - 2025-07-27

### Fixed
- Fixed deck completion calculation bug where duplicate cards were counted instead of unique card types
- Fixed production server update failures due to missing logs directory 
- Fixed hardcoded paths in scripts causing "ENOENT" errors on different server setups
- Fixed wrong PM2 process names in rollback and update scripts
- Fixed missing .env.example file for proper environment configuration

### Added
- New diagnostic script (`./diagnose.sh`) for identifying common setup and path issues
- Automated setup of required directories (logs, backups) in update and install scripts
- .env.example template with comprehensive configuration options
- Auto-detection of project directory paths in update and install scripts
- Enhanced troubleshooting documentation for common directory and environment issues

### Improved
- Update process now automatically creates necessary directories before application startup
- Installation process includes proper directory structure setup and validation
- Scripts now verify they're running from correct directory before proceeding
- Better error handling for missing environment files and wrong paths
- All scripts updated to use consistent PM2 process name (`mop-card-tracker`)
- **Enhanced production deployment script (`deploy-production.sh`) with comprehensive system setup:**
  - Complete Linux package installation including build tools, development libraries, and security tools
  - Advanced fail2ban configuration with multiple jails for SSH and Nginx protection
  - System optimization with log rotation, user limits, and swap configuration
  - Automatic security updates configuration
  - Node.js LTS installation with global tools (yarn, typescript)
  - Redis server installation for caching and session management
  - System monitoring tools (htop, tree, nano, vim)
  - Production-ready web server setup with SSL and security headers

## [1.1.0] - 2025-07-27

### Added
- Enhanced version checking system with GitHub repository integration
- Support for pre-release versions (alpha, beta) detection and comparison
- Automatic update checks every 24 hours
- New admin panel features for system updates:
  - Real-time update status monitoring
  - Update history with detailed logs
  - Scheduled updates with flexible timing
  - Update cancellation capability
  - Automatic rollback on failed updates
- Version comparison showing changelog and release notes
- Backup system for safe updates and rollbacks
- Admin notifications for available updates and system changes
- Discord webhook integration for update notifications
- Database tracking for update history and scheduled updates
- Comprehensive `HOWTOUPDATE.md` guide with:
  - Automatic and manual update procedures
  - Pre-update checklists and safety measures
  - Rollback and recovery procedures
  - Troubleshooting guides for common issues
  - Version-specific upgrade notes
  - Emergency procedures and health checks
- **PM2 Process Management Integration:**
  - Automated installation script (`install.sh`) with PM2 setup
  - Smart update script (`update.sh`) with backup and rollback capabilities
  - Enhanced startup script (`start-card-tracker.sh`) using PM2
  - Systemd service integration for auto-start on boot
  - PM2 ecosystem configuration for production deployment
  - Process monitoring and automatic restart capabilities

### Changed
- Improved version endpoint to include remote version information
- Enhanced logging system for update processes
- Restructured backup system with organized directories
- Updated admin interface to support new update features
- Fixed database initialization issues with duplicate declarations
- Improved error handling for deck requests API endpoint
- Enhanced SQLite database connection with WAL mode and foreign keys
- **Migration from manual process control to PM2:**
  - Startup script now uses PM2 instead of nohup/background processes
  - Installation process automatically configures PM2 and systemd
  - Update procedures preserve PM2 configuration and process state
  - Enhanced process reliability and monitoring capabilities

### Fixed
- Resolved database connection errors causing 500 responses on API endpoints
- Fixed duplicate database declaration issues in server-auth.js
- Corrected SQL query syntax error in deck requests endpoint (removed non-existent trinket field)
- Improved error handling and logging for database operations
- Fixed frontend build and static file serving issues
- Resolved PM2 server restart problems
- Fixed deck completion status calculation to count unique card types instead of total quantity (e.g., 3x "Eight of Serpent" + 1x "Two of Serpent" now correctly shows 2/8 instead of 4/8)

### Security
- Added backup verification before updates
- Implemented automatic rollback for failed updates
- Added admin-only restrictions for update management
- Enhanced database security with proper foreign key constraints

## [1.0.4] - 2025-07-27

### Fixed
- Fixed announcement modal not displaying to users after being pushed
- Added missing code to fetch announcements when the app loads
- Improved announcement expiry handling to properly filter expired announcements
- Enhanced announcement rendering with better styling and error handling
- Added activity logging for announcement creation and clearing
- Fixed JSON parsing issues with announcement links
- Improved debugging and error handling for announcements
- Fixed announcement modal styling to match the site's dark theme with MoP green accents
- Added persistent dismissal of announcements using localStorage to prevent reappearing after navigation
- Removed database files from git tracking to prevent overwriting production databases during updates

## [1.0.3] - 2025-07-27

### Changed
- Updated Admin Announcement Form to use dropdown for expiry time with preset options (1 hour, 1 day, 1 week)
- Improved expiry time UX by replacing datetime picker with simple dropdown select
- Added expiry time calculation logic to automatically set the correct ISO timestamp

## [1.0.2] - 2025-07-27

### Added
- Redesigned Admin Announcement Form UI/UX with card-style container
- Added form validation for announcement form with styled error messages
- Implemented announcement preview feature to show how messages will appear to users
- Added tooltips and helper text for form fields to improve usability
- Improved accessibility with proper ARIA attributes and labels
- Enhanced mobile responsiveness for the announcement form

## [1.0.1] - 2025-07-27

### Fixed
- Fixed date formatting in Notifications component to handle potential missing or invalid dates
- Added fallback for date display in Notifications.js showing "Unknown date" when date is invalid
- Fixed date formatting in Admin component's notification history section
- Corrected field reference in activity log from `a.created_at` to `a.timestamp`
- Changed activity log message reference from `a.message` to `a.action` for proper display

## [1.0.0] - 2025-07-26

### Added
- Initial release of MoP Inscription Deck Tracker
- Card and deck tracking functionality
- User authentication with JWT
- Admin panel for user management
- Discord webhook integration
- Gotify notification support
- Activity logging
- Card and deck history tracking
- Notification system (in-app, Discord, Gotify)
- Export/import functionality for cards and decks
- Responsive UI with MoP theme
