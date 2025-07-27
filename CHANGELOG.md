# Changelog

All notable changes to the MoP Inscription Deck Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
