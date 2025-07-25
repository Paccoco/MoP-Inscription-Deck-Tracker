# Copilot Agent Instructions for Mist of Pandaria Card Tracker

## Project Overview
- This is a full-stack, self-hosted web app for WoW Mist of Pandaria Classic guilds to track Inscription Cards, decks, sales, payouts, and notifications.
- Major components: React frontend (`client/src`), Express.js backend (`server-auth.js`), SQLite database (`cards.db`).
- Notification system: In-app, Discord webhook, and per-user Gotify integration (no email).
- Admin panel: User approval, deck allocation, role management, analytics, export/import, notification config.

## Architecture & Data Flow
- Frontend communicates with backend via REST API endpoints (see README for full list).
- User authentication uses JWT; token must be sent in `Authorization` header for protected endpoints.
- Notification logic is unified: all events (deck completion, approval, payout, requests, new user registration) trigger notifications via in-app, Discord, or Gotify (per user config).
- Persistent config (Discord/Gotify) stored in SQLite; each user can set their own Gotify server/token and notification types.
- Activity log tracks all major actions for transparency.

## Developer Workflows
- **Build frontend:**
  ```bash
  cd client
  npm run build
  ```
- **Start backend:**
  ```bash
  nohup node server-auth.js > server.log 2>&1 &
  ```
- **Install dependencies:**
  ```bash
  npm install
  cd client && npm install
  ```
- **Access app:**
  Open browser at `http://localhost:5000`.
- **Debugging:**
  - Backend logs to `server.log` (includes debug for notification delivery and JWT validation).
  - Frontend logs errors and token sent for API calls.
- **No email notifications:** Only in-app, Discord, and Gotify are supported.

## Project-Specific Patterns & Conventions
- All notification logic is centralized in backend (`server-auth.js`).
- Per-user notification config UI in `client/src/GotifyConfig.js`.
- Admin dashboard summary and notification center in `client/src/Admin.js` and `client/src/Notifications.js`.
- Responsive/mobile UI: Custom styles in `client/src/App.css`.
- Export/import via CSV for cards/decks (admin only).
- Discord webhook and Gotify config endpoints: `/api/discord/webhook`, `/api/gotify/config`.
- Contributor alerts for deck completions.
- Analytics dashboard uses Chart.js (placeholder for future expansion).

## Integration Points
- Discord: Automated notifications for deck completions, sales, requests.
- Gotify: Per-user server/token/notification type config; notifications sent via Gotify API.
- SQLite: Persistent storage for cards, decks, users, notifications, config, activity log.

## Key Files & Directories
- `server-auth.js`: Main backend logic, API endpoints, notification delivery, config storage.
- `client/src/GotifyConfig.js`: Per-user Gotify config UI.
- `client/src/Admin.js`: Admin dashboard, user approval, deck allocation, analytics.
- `client/src/Notifications.js`: Notification center UI.
- `client/src/App.css`: Responsive/mobile styles.
- `README.md`: Setup, features, API reference, troubleshooting.

---
For new features, follow the established notification and config patterns. Always update the activity log and ensure notification delivery is consistent across in-app, Discord, and Gotify.
