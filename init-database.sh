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
  name TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  approved INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS completed_decks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deck_name TEXT NOT NULL,
  created_at TEXT,
  contributor TEXT,
  sale_price INTEGER DEFAULT 0,
  sale_date TEXT,
  buyer TEXT
);

CREATE TABLE IF NOT EXISTS deck_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deck_name TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  request_date TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user TEXT NOT NULL,
  action TEXT NOT NULL,
  timestamp TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  message TEXT NOT NULL,
  created_at TEXT,
  read INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS card_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER,
  count_change INTEGER,
  timestamp TEXT,
  user TEXT,
  FOREIGN KEY (card_id) REFERENCES cards(id)
);

CREATE TABLE IF NOT EXISTS deck_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deck_id INTEGER,
  action TEXT NOT NULL,
  timestamp TEXT,
  user TEXT,
  FOREIGN KEY (deck_id) REFERENCES completed_decks(id)
);

CREATE TABLE IF NOT EXISTS deck_value_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deck_name TEXT NOT NULL,
  value INTEGER NOT NULL,
  timestamp TEXT
);

CREATE TABLE IF NOT EXISTS gotify_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  server_url TEXT,
  token TEXT,
  enabled INTEGER DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS announcement (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  expiry TEXT,
  links TEXT,
  active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS discord_webhook (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  enabled INTEGER DEFAULT 1
);
EOF

echo "Database schema created successfully!"
echo "Next steps:"
echo "1. Run 'npm install' to install dependencies"
echo "2. Use 'node update-admin-password.js' to set an admin password"
echo "3. Start the application with './start-card-tracker.sh'"
