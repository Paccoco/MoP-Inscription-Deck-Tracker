# Mist of Pandaria Card Tracker

**Version: 0.1b**

A self-hosted web app for World of Warcraft Classic guilds to track Inscription Cards, complete decks, manage deck sales, payouts, and more. Built for transparency, sharing, and easy guild management.

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
- Completed Decks page: view disposition (fulfilled/sold), sale price, payout split, and estimated deck value
- Backend endpoint for unallocated completed decks
- Improved navigation: Card Tracker, Admin, Completed Decks, Profile, Notifications, Analytics
- **Notifications:** In-app notifications for admin approvals, deck completions, payouts, and requests
- **Deck Request Workflow:** Users can request specific decks and track fulfillment status
- **Export/Import Data:** Export card/deck data to CSV for sharing or backup, and import CSV to restore or bulk update
- **Activity Log:** View recent actions (card added/removed, deck completed/sold) for transparency
- **User Profile:** View your cards, completed decks, payouts, and recent activity
- **Role-Based Permissions:** Admin, Officer, and User roles
- **Guild Bank:** Track and manage guild-owned cards and decks
- **Analytics Dashboard:** Charts for deck completion rates, contributor stats, payout trends
- **Theme Customization:** Choose between several MoP-themed backgrounds and color schemes
- **Deck Value Estimator:** See estimated deck/trinket values in real time
- **Email Notifications:** Opt-in for email alerts when a requested deck is completed or sold
- **Card/Deck History:** Timeline/history for each card and deck, including ownership changes and sales
- **Onboarding Modal:** New users see a quick-start guide after registration
- **Deck Value History:** View historical price trends for decks/trinkets
- **Discord Integration:** Automated notifications for deck completions, sales, and requests
- **Deck Completion Progress Bar:** Visual progress bar for each deck showing collected/total cards and percentage
- **Contributor Deck Completion Alerts:** In-app notifications for contributors when a deck is completed
- **Advanced Analytics Charts:** Contributor leaderboard, deck fulfillment speed, card acquisition trends

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
- Automated notifications for deck completions, sales, requests, and admin approvals.

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
- **Notifications:** View in-app notifications for approvals, deck completions, payouts, and requests
- **Deck Requests:** Request specific decks and track their fulfillment status
- **Export/Import:** Export your card/deck data to CSV for sharing or backup, and import CSV to restore or bulk update
- **Activity Log:** View recent actions (card added/removed, deck completed/sold) for transparency
- **Profile:** View your cards, completed decks, payouts, and recent activity
- **Guild Bank:** View and manage guild-owned cards and decks
- **Theme Customization:** Choose your preferred MoP-themed background and color scheme
- **Analytics:** View charts for deck completion rates, contributor stats, and payout trends
- **Email Notifications:** Opt-in for email alerts when a requested deck is completed or sold
- **Card/Deck History:** View timeline/history for each card and deck
- **Onboarding Modal:** See a quick-start guide after registration
- **Deck Value History:** View historical price trends for decks/trinkets
- **Discord Integration:** Get automated notifications in your guild's Discord channel

### For Admins/Officers
- **Approve Users:** Review and approve new registrations
- **Allocate Completed Decks:**
  - Select from completed/unallocated decks
  - Fulfill a deck request or sell a deck
  - Set sale price and recipient
  - View payout split for contributors
  - View estimated deck value
- **Notifications:** Users are notified automatically for approvals, deck completions, payouts, and requests
- **Deck Requests:** View and fulfill deck requests from users
- **Export/Import:** Export all card/deck data to CSV, and import CSV to restore or bulk update
- **Activity Log:** View recent actions for all users for transparency
- **Role Management:** Assign roles (Admin, Officer, User)
- **Guild Bank:** Manage guild-owned cards and decks
- **Analytics:** View deck completion rates, contributor stats, and payout history
- **Discord Integration:** Configure Discord webhook for automated notifications

## API Endpoints
- `/api/cards` - Get/add/delete cards
- `/api/completed-decks` - Get/add completed decks
- `/api/admin/completed-unallocated-decks` - Get completed decks not yet allocated
- `/api/admin/approve` - Approve users
- `/api/notifications` - Get notifications for logged-in user
- `/api/notifications/read` - Mark notification as read
- `/api/deck-requests` - Get/add deck requests
- `/api/export/cards` - Export all cards as CSV
- `/api/export/decks` - Export all completed decks as CSV
- `/api/import/cards` - Import cards from CSV
- `/api/import/decks` - Import completed decks from CSV
- `/api/activity` - Get recent activity log
- `/api/profile` - Get user profile info
- `/api/guild-bank` - Get/manage guild bank cards and decks
- `/api/analytics` - Get analytics dashboard data
- `/api/decks/:id/value` - Get estimated deck value
- `/api/decks/:deck/value-history` - Get historical value for a deck
- `/api/cards/:id/history` - Get card history
- `/api/decks/:id/history` - Get deck history
- `/api/discord/webhook` - Configure Discord webhook for notifications

## Discord How-To
See `discord-how-to.md` for a user guide on sharing progress, coordinating deck completions, and using the app with Discord.

## Contributing
Pull requests and suggestions are welcome! Please open an issue or PR for improvements.

## License
MIT

---
*Created by Paccoco for Mist of Pandaria Classic guilds.*
