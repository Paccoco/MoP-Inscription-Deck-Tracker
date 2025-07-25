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

### For Admins/Officers
- **Approve Users:** Review and approve new registrations.
- **Allocate Completed Decks:**
  - Select from completed/unallocated decks
  - Fulfill a deck request or sell a deck
  - Set sale price and recipient
  - View payout split for contributors

## API Endpoints
- `/api/cards` - Get/add/delete cards
- `/api/completed-decks` - Get/add completed decks
- `/api/admin/completed-unallocated-decks` - Get completed decks not yet allocated
- `/api/admin/approve` - Approve users

## Contributing
Pull requests and suggestions are welcome! Please open an issue or PR for improvements.

## License
MIT

---
*Created by Paccoco for Mist of Pandaria Classic guilds.*
