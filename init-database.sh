#!/bin/bash
# Initialize the database with the required schema
# This script should be run when setting up a new instance of the application

echo "Creating database schema for MoP Inscription Deck Tracker..."

# Create the database files if they don't exist
sqlite3 cards.db "PRAGMA foreign_keys = ON;"
sqlite3 cardtracker.db "PRAGMA foreign_keys = ON;"

# Create tables in cards.db
sqlite3 cards.db <<EOF
CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_name TEXT NOT NULL,
  owner TEXT NOT NULL,
  deck TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  is_admin INTEGER DEFAULT 0,
  approved INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS completed_decks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deck TEXT NOT NULL,
  contributors TEXT,
  completed_at TEXT,
  disposition TEXT,
  recipient TEXT
);

CREATE TABLE IF NOT EXISTS deck_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  deck TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  fulfilled INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS decks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deck_name TEXT NOT NULL,
  total_cards INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  timestamp TEXT
);

CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS system_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'in_progress',
  initiated_by TEXT
);

CREATE TABLE IF NOT EXISTS update_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  remote_version TEXT,
  local_version TEXT,
  update_available INTEGER DEFAULT 0,
  error TEXT
);

CREATE TABLE IF NOT EXISTS discord_webhook (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  url TEXT
);

CREATE TABLE IF NOT EXISTS gotify_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  server TEXT,
  token TEXT,
  types TEXT
);

CREATE TABLE IF NOT EXISTS announcement (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  expiry TEXT,
  links TEXT,
  active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS scheduled_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  completed_at TEXT,
  error TEXT
);
EOF

echo "Database schema created successfully!"
echo "Next steps:"
echo "1. Run 'npm install' to install dependencies"
echo "2. Use 'node update-admin-password.js' to set an admin password"
echo "3. Start the application with './start-card-tracker.sh'"
