const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || 'mop_secret';

// SQLite database setup
const dbPath = path.join(__dirname, 'cards.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_name TEXT NOT NULL,
    owner TEXT NOT NULL,
    deck TEXT NOT NULL
  )`);
  // Create users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    approved INTEGER DEFAULT 0
  )`);
  // Create completed_decks table
  db.run(`CREATE TABLE IF NOT EXISTS completed_decks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck TEXT NOT NULL,
    contributors TEXT NOT NULL, -- JSON string: [{owner, card_name}]
    completed_at TEXT NOT NULL,
    disposition TEXT NOT NULL, -- 'sold' or 'given'
    recipient TEXT -- username or external
  )`);
  // Create deck_requests table
  db.run(`CREATE TABLE IF NOT EXISTS deck_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    deck TEXT NOT NULL,
    requested_at TEXT NOT NULL,
    fulfilled INTEGER DEFAULT 0,
    fulfilled_at TEXT
  )`);
  // Create activity table
  db.run(`CREATE TABLE IF NOT EXISTS activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    action TEXT NOT NULL,
    timestamp TEXT NOT NULL
  )`);
  // Create notifications table
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  )`);
  // Card history table
  db.run(`CREATE TABLE IF NOT EXISTS card_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER,
    owner TEXT,
    action TEXT,
    timestamp TEXT
  )`);
  // Deck history table
  db.run(`CREATE TABLE IF NOT EXISTS deck_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_id INTEGER,
    action TEXT,
    details TEXT,
    timestamp TEXT
  )`);
  // Deck value history table
  db.run(`CREATE TABLE IF NOT EXISTS deck_value_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck TEXT NOT NULL,
    value INTEGER NOT NULL,
    timestamp TEXT NOT NULL
  )`);
  // Gotify config table
  db.run(`CREATE TABLE IF NOT EXISTS gotify_config (
    username TEXT PRIMARY KEY,
    server TEXT,
    token TEXT,
    types TEXT -- JSON array of enabled notification types
  )`);
  // Announcement Table
  db.run(`CREATE TABLE IF NOT EXISTS announcement (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    expiry DATETIME,
    links TEXT, -- JSON array of {label, url}
    active INTEGER DEFAULT 1
  )`);
});

// Log activity helper
function logActivity(username, action) {
  db.run(
    'INSERT INTO activity (username, action, timestamp) VALUES (?, ?, ?)',
    [username, action, new Date().toISOString()],
    function (err) {…}
  );
}

// Discord webhook integration
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';
let discordWebhookUrl = DISCORD_WEBHOOK_URL;

// Ensure discord_webhook table exists
// Only one row: {id: 1, url: webhookUrl}
db.run(`CREATE TABLE IF NOT EXISTS discord_webhook (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  url TEXT
)`);

// Load webhook from DB on startup
function loadDiscordWebhookUrl() {
  db.get('SELECT url FROM discord_webhook WHERE id = 1', [], (err, row) => {…});
}
loadDiscordWebhookUrl();

// Discord webhook config endpoints
app.get('/api/discord/webhook', auth, (req, res) => {
  res.json({ webhookUrl: discordWebhookUrl });
});
app.post('/api/discord/webhook', express.json(), auth, (req, res) => {
  const { webhookUrl } = req.body;
  if (!webhookUrl || !/^https:\/\/discord(app)?\.com\/api\/webhooks\//.test(webhookUrl)) {…}
  discordWebhookUrl = webhookUrl;
  db.run('INSERT OR REPLACE INTO discord_webhook (id, url) VALUES (1, ?)', [webhookUrl], function (err) {…});
});

// Update sendDiscordNotification to use the latest webhook
function sendDiscordNotification(message) {
  if (!discordWebhookUrl)
  fetch(discordWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message })
  })
    .then(res => {…})
    .catch(err => {…});
}

// Send Gotify notification
function sendGotifyNotification(username, type, message) {
  db.get('SELECT * FROM gotify_config WHERE username = ?', [username], (err, config) => {…});
}

// API route: Get all cards
app.get('/api/cards', (req, res) => {
  db.all('SELECT * FROM cards', [], (err, rows) => {…});
});

// API route: Add a card
app.post('/api/cards', express.json(), auth, (req, res) => {
  const { card_name, deck } = req.body;
  const owner = req.user.username;
  if (!card_name || !owner || !deck) {…}
  db.run(
    'INSERT INTO cards (card_name, owner, deck) VALUES (?, ?, ?)',
    [card_name, owner, deck],
    function (err) {…}
  );
});

// API route: Delete a card
app.delete('/api/cards/:id', auth, (req, res) => {
  const { id } = req.params;
  db.get('SELECT owner, card_name, deck FROM cards WHERE id = ?', [id], (err, card) => {…});
});

// Registration sets approved=0
app.post('/api/register', express.json(), (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {…}
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {…});
});

// Login only allows approved users
app.post('/api/login', express.json(), (req, res) => {
  const { username, password } = req.body;
  console.log('[DEBUG] Login attempt:', { username });
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {…});
});

// Auth middleware
function auth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) {…}
  const token = header.split(' ')[1];
  console.log('[DEBUG] Auth middleware: Incoming token:', token);
  jwt.verify(token, SECRET, (err, user) => {…});
}

// Middleware to require admin
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {…}
  next();
}

// Admin endpoint to approve users
app.post('/api/admin/approve', express.json(), auth, (req, res) => {
  console.log('Approve user req.body:', req.body); // Debug log
  if (!req.user.is_admin)
  const { userId } = req.body;
  db.run('UPDATE users SET approved = 1 WHERE id = ?', [userId], function (err) {…});
});

// Admin endpoint to list pending users
app.get('/api/admin/pending', auth, (req, res) => {
  if (!req.user.is_admin)
  db.all('SELECT id, username FROM users WHERE approved = 0', [], (err, rows) => {…});
});

// Admin endpoint to list all users
app.get('/api/admin/users', auth, (req, res) => {
  console.log('Admin users endpoint:', req.user);
  if (!req.user.is_admin) {…}
  db.all('SELECT * FROM users', [], (err, rows) => {…});
});

// API: Add completed deck
app.post('/api/completed-decks', express.json(), auth, (req, res) => {
  const { deck, contributors, disposition, recipient } = req.body;
  if (!deck || !contributors || !disposition) {…}
  db.run(
    'INSERT INTO completed_decks (deck, contributors, completed_at, disposition, recipient) VALUES (?, ?, ?, ?, ?)',
    [deck, JSON.stringify(contributors), new Date().toISOString(), disposition, recipient || null],
    function (err) {…}
  );
});

// API: Get completed decks
app.get('/api/completed-decks', auth, (req, res) => {
  db.all('SELECT * FROM completed_decks ORDER BY completed_at DESC', [], (err, rows) => {…});
});

// API: Submit deck request
app.post('/api/deck-requests', express.json(), auth, (req, res) => {
  const { deck } = req.body;
  const username = req.user.username;
  if (!deck)
  db.run(
    'INSERT INTO deck_requests (username, deck, requested_at, fulfilled) VALUES (?, ?, ?, 0)',
    [username, deck, new Date().toISOString()],
    function (err) {…}
  );
});

// API: Get deck requests ordered by contribution
app.get('/api/deck-requests', auth, (req, res) => {
  db.all(`
    SELECT r.*, IFNULL(c.count,0) as contribution, r.trinket
    FROM deck_requests r
    LEFT JOIN (
      SELECT owner, COUNT(*) as count FROM cards GROUP BY owner
    ) c ON r.username = c.owner
    ORDER BY r.fulfilled ASC, contribution DESC, r.requested_at ASC
  `, [], (err, rows) => {…});
});

// API: Admin requests cards from users for a deck
app.post('/api/admin/request-cards', express.json(), auth, (req, res) => {
  if (!req.user.is_admin)
  const { deck, cardRequests } = req.body; // cardRequests: [{username, card_name}]
  if (!deck || !cardRequests || !Array.isArray(cardRequests)) {…}
  // For now, just log the requests (could be extended to notify users)
  // You may want to store these requests in a table for tracking
  res.json({ success: true, requested: cardRequests.length });
});

// API: Admin completes a deck (fulfill request or sell)
app.post('/api/admin/complete-deck', express.json(), auth, (req, res) => {
  if (!req.user.is_admin)
  const { deck, contributors, disposition, recipient, salePrice } = req.body;
  if (!deck || !contributors || !disposition) {…}
  let payouts = null;
  if (disposition === 'sold' && salePrice) {…}
  db.run(
    'INSERT INTO completed_decks (deck, contributors, completed_at, disposition, recipient) VALUES (?, ?, ?, ?, ?)',
    [deck, JSON.stringify(contributors), new Date().toISOString(), disposition, recipient || null],
    function (err) {…}
  );
});

// Admin endpoint: Get completed but unallocated decks
app.get('/api/admin/completed-unallocated-decks', auth, (req, res) => {
  if (!req.user.is_admin)
  db.all("SELECT * FROM completed_decks WHERE disposition IS NULL OR disposition NOT IN ('sold', 'fulfilled')", [], (err, rows) => {…});
});

// User profile endpoint
app.get('/api/profile', auth, (req, res) => {
  const username = req.user.username;
  db.all('SELECT * FROM cards WHERE owner = ?', [username], (err, cards) => {…});
});

// API: Get notifications for user
app.get('/api/notifications', auth, (req, res) => {
  db.all('SELECT * FROM notifications WHERE username = ? ORDER BY created_at DESC', [req.user.username], (err, rows) => {…});
});

// API: Mark notification as read
app.post('/api/notifications/read', express.json(), auth, (req, res) => {
  const { id } = req.body;
  db.run('UPDATE notifications SET read = 1 WHERE id = ?', [id], function (err) {…});
});

// CSV export/import endpoints
const csvStringify = (rows, columns) => {
  const header = columns.join(',');
  const data = rows.map(row => columns.map(col => JSON.stringify(row[col] ?? '')).join(',')).join('\n');
  return header + '\n' + data;
};

// Export all cards as CSV
app.get('/api/export/cards', auth, (req, res) => {
  db.all('SELECT * FROM cards', [], (err, rows) => {…});
});

// Export all completed decks as CSV
app.get('/api/export/decks', auth, (req, res) => {
  db.all('SELECT * FROM completed_decks', [], (err, rows) => {…});
});

// Get card history
app.get('/api/cards/:id/history', auth, (req, res) => {
  db.all('SELECT * FROM card_history WHERE card_id = ?', [req.params.id], (err, rows) => {…});
});

// Get deck history
app.get('/api/decks/:id/history', auth, (req, res) => {
  db.all('SELECT * FROM deck_history WHERE deck_id = ?', [req.params.id], (err, rows) => {…});
});

// Admin: Get global activity log
app.get('/api/activity/all', auth, (req, res) => {
  console.log('Activity log request user:', req.user); // Debug log
  if (!req.user.is_admin) // Always return array on error
  db.all('SELECT * FROM activity ORDER BY timestamp DESC LIMIT 50', [], (err, rows) => {…});
});

// User: Get own activity log
app.get('/api/activity', auth, (req, res) => {…});

// Gotify config endpoints
app.get('/api/gotify/config', auth, (req, res) => {…});

app.post('/api/gotify/config', express.json(), auth, (req, res) => {…});

// Notify user function (Discord + Gotify)
function notifyUser(username, type, message) {…}

// Security Dashboard API endpoints
app.get('/api/admin/security-scan', auth, (req, res) => {…});

app.get('/api/admin/dependency-status', auth, (req, res) => {…});

app.get('/api/admin/notification-history', auth, (req, res) => {…});

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'client', 'build')));

// Catch-all route to serve React index.html for non-API routes
app.get('*', (req, res) => {…});

// API: Remove deck request (admin or user)
app.delete('/api/deck-requests/:id', express.json(), auth, (req, res) => {…});

// API: Delete a single notification
app.delete('/api/notifications/:id', auth, (req, res) => {…});

// API: Delete all notifications for user
app.delete('/api/notifications', auth, (req, res) => {…});

// Remove user access (admin only)
app.post('/api/admin/remove-user', express.json(), auth, (req, res) => {…});

// Announcement endpoints
app.get('/api/announcements', auth, (req, res) => {…});

app.post('/api/announcements', express.json(), auth, (req, res) => {…});

// API: Delete an announcement (admin only)
app.delete('/api/announcements/:id', auth, (req, res) => {…});

// Announcement Endpoints
app.get('/api/announcement', async (req, res) => {…});

app.post('/api/admin/announcement', requireAdmin, async (req, res) => {…});

app.delete('/api/admin/announcement', requireAdmin, async (req, res) => {…});

app.listen(PORT, () => {…});
