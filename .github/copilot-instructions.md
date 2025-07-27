# Copilot Agent Instructions for Mist of Pandaria Card Tracker

## Project Overview
- This is a full-stack, self-hosted web app for WoW Mist of Pandaria Classic guilds to track Inscription Cards, decks, sales, payouts, and notifications.
- Major components: React frontend (`client/src`), Express.js backend (`server-auth.js`), SQLite database (`cards.db`).
- Notification system: In-app, Discord webhook, and per-user Gotify integration (no email).
- Admin panel: User approval, deck allocation, role management, analytics, export/import, notification config.

### 🔄 Project Awareness & Context
- **Always read `PLANNING.md`** at the start of a new conversation to understand the project's architecture, goals, style, and constraints.
- **Check `TASK.md`** before starting a new task. If the task isn’t listed, add it with a brief description and today's date.
- **Use consistent naming conventions, file structure, and architecture patterns** as described in `PLANNING.md`.

### 🧱 Code Structure & Modularity
- **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
- **Organize code into clearly separated modules**, grouped by feature or responsibility.
- **Use clear, consistent imports** (prefer relative imports within packages).wa

### 🧪 Testing & Reliability
- **Always create tests for new features** (functions, classes, routes, etc).
- **After updating any logic**, check whether existing unit tests need to be updated. If so, do it.
- **Tests should live in a `/tests` folder** mirroring the main app structure.
  - Include at least:
    - 1 test for expected use
    - 1 edge case
    - 1 failure case

### ✅ Task Completion
- **Mark completed tasks in `TASK.md`** immediately after finishing them.
- Add new sub-tasks or TODOs discovered during development to `TASK.md` under a “Discovered During Work” section.

### 📚 Documentation & Explainability
- **Update `README.md`** when new features are added, dependencies change, or setup steps are modified.
- **Comment non-obvious code** and ensure everything is understandable to a mid-level developer.
- When writing complex logic, **add an inline `# Reason:` comment** explaining the why, not just the what.

### 🧠 AI Behavior Rules
- **Never assume missing context. Ask questions if uncertain.**
- **Never hallucinate libraries or functions**
- **Always confirm file paths and module names** exist before referencing them in code or tests.



## Architecture & Data Flow
- Frontend communicates with backend via REST API endpoints (see README for full list).
- User authentication uses JWT; token must be sent in `Authorization` header for protected endpoints.
- Notification logic is unified: all events (deck completion, approval, payout, requests, new user registration) trigger notifications via in-app, Discord, or Gotify (per user config).
- Persistent config (Discord/Gotify) stored in SQLite; each user can set their own Gotify server/token and notification types.
- Activity log tracks all major actions for transparency.

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

## Copilot Agent Policy
- Every time you make a code or feature change, you MUST update the README.md to reflect the change. This includes bug fixes, UI/UX changes, new features, workflow updates, or any modification that affects usage, setup, or functionality.
- README.md must always be kept in sync with the current state of the codebase and user-facing features.
- You MUST always ask the user for confirmation before committing or pushing any changes to GitHub.
- You MUST always bug check (validate and test) code before reporting a task as completed.
- When updating or tracking tasks in `tasks.md`, ONLY use ✅ to mark completed tasks. Incomplete or not started tasks should not be marked in any way.

---
For new features, follow the established notification and config patterns. Always update the activity log and ensure notification delivery is consistent across in-app, Discord, and Gotify.
