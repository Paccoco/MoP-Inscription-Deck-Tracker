# Mist of Pandaria Card Tracker

A self-hosted web app for World of Warcraft Classic guilds to track Inscription Cards, complete decks, and manage deck sales and payouts. Built for easy guild management, sharing, and transparency.

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
- Admin panel for user approval and deck allocation
- Completed Decks page: view disposition (fulfilled/sold), sale price, and payout split
- Backend endpoint for unallocated completed decks
- Improved navigation: Card Tracker, Admin, Completed Decks
- **Notifications:** In-app notifications for admin approvals, deck completions, and payouts
- **Deck Request Workflow:** Users can request specific decks and track fulfillment status
- **Export/Import Data:** Export card/deck data to CSV for sharing or backup, and import CSV to restore or bulk update
- **Activity Log:** View recent actions (card added/removed, deck completed/sold) for transparency
- **User Profile Page:** View your cards, completed decks, payouts, and recent activity
- **Role-Based Permissions:** Admin, Officer, and User roles with different access levels
- **Admin Panel:** Approve users, allocate decks, fulfill requests, view contributor breakdown, manage payouts
- **Guild Bank:** Track and manage guild-owned cards and decks
- **API Documentation:** Built-in API docs for endpoints
- **Analytics Dashboard:** View deck completion rates, contributor stats, and payout history
- **Error Handling:** Improved UI for empty states (profile, notifications, activity log)
- **Modern UI:** Navigation as buttons, MoP visuals, color fixes, mobile-friendly
- **Auto-Proceed:** App rebuilds and restarts after changes

## Tech Stack
- Node.js + Express.js (backend)
- React (frontend)
- SQLite (database)

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
4. **Start the server:**
   ```bash
   node server-auth.js
   ```
   Or use the provided `start-card-tracker.sh` script for auto-start on reboot.

5. **Access the app:**
   Open your browser and go to `http://localhost:5000` (or your server's IP/domain).

## How To Use
### For All Users
- **Register:** Create an account and wait for admin approval.
- **Login:** Access your account once approved.
- **Track Cards:** Add/remove cards you own on the Card Tracker page.
- **View Deck Progress:** See grid/summary views and Wowhead trinket tooltips. Completed decks are highlighted.
- **Completed Decks:** View all completed decks, their disposition, sale price, and payout split.
- **Notifications:** View in-app notifications for approvals, deck completions, and payouts.
- **Deck Requests:** Request specific decks and track their fulfillment status.
- **Export/Import:** Export your card/deck data to CSV for sharing or backup, and import CSV to restore or bulk update.
- **Activity Log:** View recent actions (card added/removed, deck completed/sold) for transparency.
- **Profile:** View your cards, completed decks, payouts, and recent activity.
- **Guild Bank:** View and manage guild-owned cards and decks.

### For Admins/Officers
- **Approve Users:** Review and approve new registrations.
- **Allocate Completed Decks:**
  - Select from completed/unallocated decks
  - Fulfill a deck request or sell a deck
  - Set sale price and recipient
  - View payout split for contributors
  - **Notifications:** Users are notified automatically for approvals, deck completions, and payouts.
  - **Deck Requests:** View and fulfill deck requests from users.
  - **Export/Import:** Export all card/deck data to CSV, and import CSV to restore or bulk update.
  - **Activity Log:** View recent actions for all users for transparency.
  - **Role Management:** Assign roles (Admin, Officer, User)
  - **Guild Bank:** Manage guild-owned cards and decks
  - **Analytics:** View deck completion rates, contributor stats, and payout history

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

## Contributing
Pull requests and suggestions are welcome! Please open an issue or PR for improvements.

## License
MIT

---
*Created by Paccoco for Mist of Pandaria Classic guilds.*
