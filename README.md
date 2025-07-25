# Mist of Pandaria Card Tracker

A self-hosted web app to help World of Warcraft Classic guilds track who has which Mist of Pandaria Inscription Cards and complete decks. Built for easy guild management and sharing.

## Features
- Track all MoP Inscription Cards and deck completion
- Grid and summary views for cards and decks
- Wowhead tooltips for trinkets in Deck Status
- Mobile-friendly responsive design
- Dark mode and MoP-themed visuals
- Add/remove cards and owners
- SQLite database for persistent storage
- React frontend, Express backend
- Easy deployment and auto-start script
- **Admin panel:** Approve users, allocate completed decks (choose from completed/unallocated decks, fulfill or sell, set sale price and recipient, see payout split)
- **Completed Decks page:** View all completed decks, their disposition (fulfilled/sold), sale price, and payout split
- **Backend endpoint:** `/api/admin/completed-unallocated-decks` returns completed decks not yet allocated
- **Improved navigation:** Quick access to Card Tracker, Admin, and Completed Decks pages

## Tech Stack
- Node.js + Express.js (backend)
- React (frontend)
- SQLite (database)

## Setup & Usage
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
   Or use the provided `start-card-tracker.sh` script for auto-start.

5. **Access the app:**
   Open your browser and go to `http://localhost:5000` (or your server's IP/domain).
   - Use the **Admin** page to approve users and allocate completed decks.
   - Use the **Completed Decks** page to view all completed decks, what they were used for, sale price (if sold), and payout split among contributors.

## Contributing
Pull requests and suggestions are welcome! Please open an issue or PR for improvements.

## License
MIT

---

*Created by Paccoco for Mist of Pandaria Classic guilds.*
