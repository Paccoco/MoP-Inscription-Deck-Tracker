# Mist of Pandaria Card Tracker

**Version: 0.5.6**

A self-hosted web app for World of Warcraft: Mist of Pandaria - Classic guilds to track Inscription Cards, complete decks, manage deck sales, payouts, and more. Built for transparency, sharing, and easy guild management.

## Recent Changes
- Enhanced Gotify security notifications: Now include severity, risk description, and context in alerts. CI workflow passes these details automatically.
- Security workflow: Automated security checks via GitHub Actions, with Gotify alerts for vulnerabilities detected by npm audit or ggshield.
- Frontend rebuilt and backend restarted for full bug check and validation after dependency updates.
- `.gitignore` updated to ignore `server.log` and all log files; `server.log` removed from repository.
- Confirmed no secrets or sensitive information in codebase via GitGuardian CLI scan.
- All previous features and UI/UX improvements remain in place.
- Version bumped to 0.5.6 for security and notification enhancements.

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
   git clone https://github.com/Paccoco/project-card-tracker.git
   cd project-card-tracker
   ```
2. **Install dependencies:**
   ```bash
   npm install
   cd client && npm install
   cd ..
   ```
3. **Build the React frontend:**
   ```bash
   cd client
   npm run build
   cd ..
   ```
4. **Start the backend server:**
   ```bash
   nohup node server-auth.js > server.log 2>&1 &
   ```
5. **Access the app:**
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
![Completed Decks](docs/screenshots/completed-decks.png)
![Analytics](docs/screenshots/analytics.png)

### Example GIF: Deck Completion Flow
![Deck Completion Flow](docs/screenshots/deck-completion.gif)

---
*Replace these placeholders with your own screenshots and GIFs for a more visual onboarding experience.*

## Troubleshooting
- If notifications are not received, check your Gotify/Discord config and ensure your server is running.
- For mobile issues, ensure your browser is up to date and try resizing the window.
- For export/import problems, verify CSV format and file encoding.

## Contributing
Pull requests and suggestions are welcome! Please open an issue or PR for improvements.

## License
MIT

---
*Created by Paccoco for Mist of Pandaria Classic guilds.*
