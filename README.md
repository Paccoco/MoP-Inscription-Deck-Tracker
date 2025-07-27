# Mist of Pandaria Card Tracker

## Screenshots

### Homepage
![Homepage](docs/screenshots/homepage.png)

**Version: 1.0.4**

A self-hosted web app for World of Warcraft: Mist of Pandaria - Classic guilds to track Inscription Cards, complete decks, manage deck sales, payouts, and more. Built for transparency, sharing, and easy guild management.

## Recent Changes
- **Improved Card Addition Interface:** Enhanced the card addition form to use a dropdown selection instead of manual text entry, making it easier to add cards accurately and eliminating typos. The dropdown includes all available card names from Crane, Ox, Serpent, and Tiger decks.
- **Fixed Card Addition Functionality:** Restored the card addition form in the My Cards page, allowing users to add new cards to decks. The form includes input validation and automatically determines the correct deck based on the selected card.
- Fixed session expired/login flow for normal users: If no token is present, the app now shows the login/register forms and does not trigger a sessionExpired loop. Only fetches profile if a token exists. This resolves issues where non-admin users could not log in after session expiration.
- Updated `.github/copilot-instructions.md` to require using `power-restart.sh` for all frontend builds and backend restarts.
- All bug checks and validation now use the power-restart workflow.
- Site-wide auto-refresh and session expiration handling: All major pages now use a unified auto-refresh hook (`useAutoRefresh`) for live data updates and automatic session expiration detection. This improves reliability and user experience across Activity Log, Guild Bank, Card/Deck History, Deck Value History, Analytics, Completed Decks, Card Tracker, Onboarding Modal, Gotify Config, and App.
- Enhanced Gotify security notifications: Now include severity, risk description, and context in alerts. CI workflow passes these details automatically.
- Security workflow: Automated security checks via GitHub Actions, with Gotify alerts for vulnerabilities detected by npm audit or ggshield.
- Frontend rebuilt and backend restarted for full bug check and validation after dependency updates.
- `.gitignore` updated to ignore `server.log` and all log files; `server.log` removed from repository.
- Confirmed no secrets or sensitive information in codebase via GitGuardian CLI scan.
- All previous features and UI/UX improvements remain in place.
- Version bumped to 0.6.0 for site-wide auto-refresh/session handling and documentation updates.
- **Admin User Management:** Admins can now remove user access directly from the Admin panel. This action deletes the user, their notification config, and all notifications, and is logged in the activity log for transparency.
- **Built-in Debugging for Login Issues:**
  - The backend now logs all login attempts, user lookup, password checks, and JWT validation steps to `server.log`.
  - All 401/403 responses during login include a `debug` field in the JSON response for easier troubleshooting.
  - Debug logs are visible in `server.log` and can be used to trace authentication failures (invalid credentials, not approved, password mismatch, missing headers, JWT errors).
  - To test/debug login issues, attempt to log in and review both the browser console and `server.log` for detailed error context.
- Fixed login flow bug: After successful login, user info is now passed from the backend to the frontend, allowing the app to correctly set login state and fetch protected data (deck requests, completed decks, etc.).
- Deck Requests table now correctly displays all requests after login for all users.
- Bug check: Frontend rebuilt and backend restarted; deck requests confirmed visible and up-to-date for all users.
- **Wowhead Tooltips Region Fix:** Deck/trinket tooltips now use MoP Classic region (`domain=mop-classic`) for accurate item data. Updated Wowhead script and deck/trinket links in the frontend for MoP Classic compatibility.
- **Deck Requests Table Bug Fix:** Deck Requests table now reliably displays all requests for all users after login. Bug check and validation performed; confirmed working.
- **Frontend/Backend Rebuilds:** Frontend rebuilt and backend restarted after each major change for validation.

## Release Notes: Version 1.0.4 (2025-07-27)

### Major Improvements
- Fixed announcement modal styling to match the site's dark theme with MoP green accents
- Added persistent dismissal of announcements using localStorage to prevent reappearing after navigation
- Improved error handling and debugging for the announcement system
- Removed database files from git tracking to prevent overwriting production databases during updates
- Added database initialization script for new installations

For detailed changes and bug fixes, please refer to the [CHANGELOG.md](CHANGELOG.md) file.

## Release Notes: Version 0.5.7b (2025-07-25)

### Major Features & Improvements
- **Security Dashboard (Admin Panel):**
  - View recent security scan results (npm audit, ggshield), dependency status, and notification history.
  - Filterable tables, export options, and CI log links for transparency.
- **Automated Dependency Updates:**
  - Dependabot integration for weekly PRs on outdated/vulnerable dependencies.
  - Documented workflow for safe, automated updates.
- **Automated Test Coverage Reporting:**
  - Jest coverage reporting for backend and frontend.
  - Coverage instructions and CI integration documented.
- **Documentation:**
  - README updated for new features, workflows, and troubleshooting.
  - All new endpoints and admin features described.
- **Bug Checks & Validation:**
  - Full bug check and validation for new features.
- **Admin User Management:**
  - Admins can now remove user access directly from the Admin panel.
  - This action deletes the user, their notification config, and all notifications.
  - Removal is logged in the activity log for transparency.

### How to Upgrade
- Pull the latest changes from `master`.
- Rebuild frontend and restart backend for full feature access.
- Review new admin dashboard and workflows in README.

## Features
- Track all Mist of Pandaria Inscription Cards
- Grid and summary views for cards and decks
- Wowhead tooltips for trinkets in Deck Status
- Mobile-friendly, responsive design
- Dark mode and MoP-themed visuals
- Add/remove cards and owners
- Notifications page features improved readability with a solid background and aligned delete buttons
- All major sections use card-style backgrounds and improved layout for a modern, clean look
- SQLite database for persistent storage
- React frontend, Express backend
- Easy deployment and auto-start script
- Admin panel for user approval, deck allocation, and role management
- Completed Decks page: view disposition (fulfilled/sold), sale price, payout split, and estimated deck value
- Backend endpoint for unallocated completed decks
- Improved navigation: Card Tracker, Admin, Completed Decks, Profile, Notifications, Analytics
- **Admin Announcement Modal:** Admins can push out a modal announcement to all users at any time. Announcement includes message, expiry, and optional links. Users see the modal on login/page load if active and not expired.
- **Notifications:** In-app notifications for admin approvals, deck completions, payouts, requests, and new user registrations. You can now delete individual notifications or mass delete all notifications from the Notifications page.
- **User Profile:** View your cards, completed decks, payouts, recent activity, and configure Gotify notifications
- **Discord Integration:** Automated notifications for deck completions, sales, and requests
- **Contributor Deck Completion Alerts:** In-app notifications for contributors when a deck is completed
- **Gotify Notifications:** Each user can configure their own Gotify server and token in their profile, and select which notification types they want to receive (deck completion, approval, payout, requests, new user registration for admins).

## Tech Stack
- Node.js + Express.js (backend)
- React (frontend)
- SQLite (database)
- Chart.js (analytics)

## Setup & Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Paccoco/MoP-Inscription-Deck-Tracker.git
   cd MoP-Inscription-Deck-Tracker
   ```
2. **Initialize the database:**
   ```bash
   ./init-database.sh
   ```
   This will create the necessary database schema for the application.

3. **Install dependencies:**
   ```bash
   npm install
   cd client && npm install
   cd ..
   ```
4. **Build the React frontend:**
   ```bash
   cd client
   npm run build
   cd ..
   ```
5. **Create an admin user:**
   ```bash
   node update-admin-password.js
   ```
   Follow the prompts to set up the admin account.

6. **Start the backend server:**
   ```bash
   ./start-card-tracker.sh
   ```
7. **Access the app:**
   Open your browser and go to `http://localhost:5000` (or your server's IP/domain).

## Discord & Gotify Integration
- Configure Discord webhook and Gotify server/token in the Admin Panel.
- **Each user can configure their own Gotify server and token in their profile, and select which notification types they want to receive.**
- Automated notifications for deck completions, sales, requests, admin approvals, and new user registrations (admin only).

## Advanced Analytics
- View contributor leaderboard, deck fulfillment speed, and card acquisition trends in the Admin Panel.

## Progress Bar & Alerts
- See deck completion progress bars in Completed Decks and Admin Panel.
- Contributors receive alerts when a deck they contributed to is completed.

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
- **Guild Bank:** View and manage guild-owned cards and decks
- **Theme Customization:** Choose your preferred MoP-themed background and color scheme
- **Analytics:** View charts for deck completion rates, contributor stats, and payout trends
- **Card/Deck History:** View timeline/history for each card and deck
- **Onboarding Modal:** See a quick-start guide after registration
- **Deck Value History:** View historical price trends for decks/trinkets
- **Discord & Gotify Integration:** Get automated notifications in your guild's Discord channel and/or your own Gotify server

### For Admins/Officers
- **Approve Users:** Review and approve new registrations (receive notification for new user needing approval)
- **Allocate Completed Decks:**
  - Select from completed/unallocated decks
  - Fulfill a deck request or sell a deck
  - Set sale price and recipient
  - View payout split for contributors
  - View estimated deck value
- **Notifications:** Users are notified automatically for approvals, deck completions, payouts, requests, and new user registrations
- **Deck Requests:** View and fulfill deck requests from users
- **Export/Import:** Export/import all card/deck data to CSV (**admin panel only**)
- **Activity Log:** View recent actions for all users for transparency
- **Role Management:** Assign roles (Admin, Officer, User)
- **Guild Bank:** Manage guild-owned cards and decks
- **Analytics:** View deck completion rates, contributor stats, and payout history
- **Discord & Gotify Integration:** Configure Discord webhook for automated notifications, and set up Gotify for guild-wide or personal notifications
- **User Removal:**
  - Remove user access directly from the Admin panel.
  - This action deletes the user, their notification config, and all notifications.
  - Removal is logged in the activity log for transparency.

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
- `/api/import/cards` - Import cards from CSV (**admin only**)
- `/api/import/decks` - Import completed decks from CSV (**admin only**)
- `/api/activity` - Get recent activity log
- `/api/activity/all` - Get recent activity log for all users (**admin only**)
- `/api/profile` - Get user profile info
- `/api/gotify/config` - Configure Gotify server/token and notification types (per user)
- `/api/guild-bank` - Get/manage guild bank cards and decks
- `/api/analytics` - Get analytics dashboard data
- `/api/decks/:id/value` - Get estimated deck value
- `/api/decks/:deck/value-history` - Get historical value for a deck
- `/api/cards/:id/history` - Get card history
- `/api/decks/:id/history` - Get deck history
- `/api/discord/webhook` - Configure Discord webhook for notifications

## Automated Dependency Updates

This repository uses **Dependabot** (or Renovate) for automated dependency updates:
- Dependabot is enabled in GitHub repository settings to check for outdated or vulnerable dependencies in `package.json` and `package-lock.json`.
- Dependabot automatically creates pull requests for dependency updates on a weekly schedule (or on release).
- Each PR includes details about the update, changelog, and security impact.
- All dependency update PRs are reviewed and merged after passing CI and security checks.

**Workflow:**
1. Dependabot scans for outdated/vulnerable dependencies.
2. Creates PRs for updates.
3. CI runs security and test checks.
4. Admin reviews and merges PRs.

For more details, see `.github/dependabot.yml` or repository settings.

## Discord How-To
See `discord-how-to.md` for a user guide on sharing progress, coordinating deck completions, and using the app with Discord.

## Screenshots & GIFs

Below are example screenshots and GIFs demonstrating key features and UI sections. Add your own images to `docs/screenshots/` and update the links as needed.

### Dashboard/Main UI
![Dashboard](docs/screenshots/dashboard.png)

### Notification Configuration (Gotify/Discord)
![Notification Config](docs/screenshots/notification-config.png)

### Admin Panel (User Approval, Deck Allocation)
![Admin Panel](docs/screenshots/admin-panel.png)

### Mobile View (Responsive Design)
![Mobile View](docs/screenshots/mobile-view.png)

### Completed Decks & Analytics
![Completed Decks](docs/screenshots/completed_decks.png)
![Analytics](docs/screenshots/analytics.png)

### Example GIF: Deck Completion Flow
![Deck Completion Flow](docs/screenshots/deck-completion.gif)

---
*Replace these placeholders with your own screenshots and GIFs for a more visual onboarding experience.*

## Troubleshooting
- If notifications are not received, check your Gotify/Discord config and ensure your server is running.
- For mobile issues, ensure your browser is up to date and try resizing the window.
- For export/import problems, verify CSV format and file encoding.
- If login issues occur, review the `debug` field in the JSON response for 401/403 errors, and check `server.log` for detailed debug logs on the backend.

## Contributing
Pull requests and suggestions are welcome! Please open an issue or PR for improvements.

## License
MIT

## Test Coverage Reporting

This repository uses **Jest** for backend and frontend test coverage:
- Run `npm test -- --coverage` to generate a coverage report for all tests.
- Coverage results are displayed in the terminal and saved in the `coverage/` directory.
- The admin dashboard displays coverage status and summary (coming soon).
- A coverage badge will be added to the README once CI integration is complete.

**How to run coverage locally:**
```bash
npm test -- --coverage
```

**How to interpret results:**
- Coverage summary includes statements, branches, functions, and lines covered.
- Review uncovered lines/functions for missing tests.

**CI Integration:**
- Coverage reporting will be integrated into CI workflows for automated status updates.

---
*Created by Paccoco for Mist of Pandaria Classic guilds.*

## Power Restart Script

A new script `power-restart.sh` is available to automate rebuilding the frontend and restarting the backend:

### Usage
```bash
./power-restart.sh
```
- Kills any backend process running on port 5000
- Rebuilds the React frontend
- Restarts the backend (`nohup node server-auth.js > server.log 2>&1 &`)
- Prints status and access URL

This script streamlines the workflow for bug checks, validation, and deployment. Make sure it is executable:
```bash
chmod +x power-restart.sh
```
