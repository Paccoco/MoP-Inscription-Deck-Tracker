# Changelog

All notable changes to the MoP Inscription Deck Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
