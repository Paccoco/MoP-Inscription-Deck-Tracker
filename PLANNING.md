# Mist of Pandaria Card Tracker — Planning Document

## Project Vision
A full-stack, self-hosted web application for World of Warcraft: Mist of Pandaria Classic guilds to transparently track Inscription Cards, deck completions, sales, payouts, and notifications. The goal is to empower guilds with collaborative tools, automated notifications, and robust admin controls, all tailored for MoP Classic.

## High-Level Scope
- **Card & Deck Tracking:** Track all MoP Inscription cards, deck completion status, contributors, and disposition (sold/given).
- **User Management:** Registration, approval, roles (Admin, Officer, User), and profile management.
- **Notifications:** Unified system for in-app, Discord webhook, and per-user Gotify notifications. No email support.
- **Admin Panel:** User approval, deck allocation, analytics, export/import, notification config, and activity log.
- **Activity Log:** Persistent, transparent logging of all major actions.
- **Analytics:** Contributor leaderboard, deck fulfillment speed, card acquisition trends, payout history, and deck value history.
- **Export/Import:** CSV-based data portability for cards and decks (admin only).
- **Responsive UI:** Mobile-friendly, MoP-themed visuals, dark mode, and customizable themes.

## Technical Architecture
- **Frontend:** React (SPA), custom CSS for MoP/dark theme, Chart.js for analytics, REST API integration.
- **Backend:** Node.js + Express.js, RESTful endpoints, JWT authentication, notification logic, SQLite database.
- **Database:** SQLite for persistent storage of cards, decks, users, notifications, config, and activity log.
- **Notifications:**
  - In-app: Real-time updates and notification center.
  - Discord: Automated webhook for deck completions, sales, requests.
  - Gotify: Per-user server/token/type config, sent via Gotify API.
- **Security:**
  - JWT-based authentication for all protected endpoints.
  - Admin-only actions for user approval, deck allocation, export/import, and analytics.
  - Automated security checks (npm audit, ggshield) with Gotify alerts.

## Key Features & Milestones
1. **Core Card/Deck Tracking**
   - Add/remove cards, view deck status, contributors, and disposition.
2. **User Authentication & Roles**
   - Registration, approval, login, JWT, role-based UI and API access.
3. **Notification System**
   - Unified delivery logic, config UI, Discord/Gotify integration, notification center.
4. **Admin Dashboard**
   - User approval, deck allocation, analytics, export/import, notification config, activity log.
5. **Activity Log & Transparency**
   - Persistent logging, user-facing log UI, admin view for all users.
6. **Analytics & Reporting**
   - Contributor leaderboard, deck fulfillment speed, payout history, deck value history.
7. **Export/Import**
   - CSV-based data export/import for cards and decks (admin only).
8. **Responsive UI & Theming**
   - Mobile-friendly layout, MoP/dark theme, theme customization.
9. **Security & Validation**
   - Automated security checks, debug logging, session expiration handling.

## Integration Points
- **Discord:** Automated notifications for deck completions, sales, requests.
- **Gotify:** Per-user server/token/type config, notification delivery via Gotify API.
- **Chart.js:** Analytics dashboard (future expansion).

## Development Workflow
- **Frontend:**
  - Build: `cd client && npm run build`
  - Debug: Browser console, token sent for API calls.
- **Backend:**
  - Start: `nohup node server-auth.js > server.log 2>&1 &`
  - Debug: `server.log` (notification delivery, JWT validation).
- **Dependencies:**
  - Install: `npm install && cd client && npm install`
- **Deployment:**
  - Access: `http://localhost:5000`
  - Power restart: `./power-restart.sh`

## Future Directions
- **Advanced Analytics:** Expand Chart.js integration for deeper insights.
- **Role Management:** More granular permissions (Officer, Contributor).
- **Guild Bank:** Shared card/deck management for guild-owned assets.
- **API Expansion:** More endpoints for automation and integrations.
- **UI/UX Enhancements:** More onboarding, help, and customization options.

## Out of Scope
- Email notifications (explicitly unsupported).
- Support for non-MoP Classic regions/items.
- Non-guild use cases (focus is on guild collaboration).

---
This planning document sets the high-level direction, scope, and technical foundation for the Mist of Pandaria Card Tracker project. All features and workflows are designed for transparency, collaboration, and ease of use for MoP Classic guilds.
