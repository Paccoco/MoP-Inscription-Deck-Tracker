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
    function (err) {
      if (err) {
        console.error('Activity log error:', err);
      }
    }
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
  db.get('SELECT url FROM discord_webhook WHERE id = 1', [], (err, row) => {
    if (err) {
      console.error('Error loading Discord webhook URL:', err);
      return;
    }
    if (row && row.url) {
      discordWebhookUrl = row.url;
    }
  });
}
loadDiscordWebhookUrl();

// Discord webhook config endpoints
app.get('/api/discord/webhook', auth, (req, res) => {
  res.json({ webhookUrl: discordWebhookUrl });
});
app.post('/api/discord/webhook', express.json(), auth, (req, res) => {
  const { webhookUrl } = req.body;
  if (!webhookUrl || !/^https:\/\/discord(app)?\.com\/api\/webhooks\//.test(webhookUrl)) {
    return res.status(400).json({ error: 'Invalid Discord webhook URL.' });
  }
  discordWebhookUrl = webhookUrl;
  db.run('INSERT OR REPLACE INTO discord_webhook (id, url) VALUES (1, ?)', [webhookUrl], function (err) {
    if (err) {
      console.error('Error saving Discord webhook URL:', err);
      return res.status(500).json({ error: 'Failed to save webhook URL.' });
    }
    res.json({ success: true });
  });
});

// Update sendDiscordNotification to use the latest webhook
function sendDiscordNotification(message) {
  if (!discordWebhookUrl) return;
  fetch(discordWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message })
  })
    .then(res => {
      if (!res.ok) {
        console.error('Discord notification failed:', res.statusText);
      }
    })
    .catch(err => {
      console.error('Discord notification error:', err);
    });
}

// Send Gotify notification
function sendGotifyNotification(username, type, message) {
  db.get('SELECT * FROM gotify_config WHERE username = ?', [username], (err, config) => {
    if (err || !config || !config.server || !config.token) return;
    fetch(`${config.server}/message?token=${config.token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: type, message })
    })
      .then(res => {
        if (!res.ok) {
          console.error('Gotify notification failed:', res.statusText);
        }
      })
      .catch(err => {
        console.error('Gotify notification error:', err);
      });
  });
}

// API route: Get all cards
app.get('/api/cards', (req, res) => {
  db.all('SELECT * FROM cards', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch cards.' });
    res.json(rows);
  });
});

// API route: Add a card
app.post('/api/cards', express.json(), auth, (req, res) => {
  const { card_name, deck } = req.body;
  const owner = req.user.username;
  if (!card_name || !owner || !deck) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  db.run(
    'INSERT INTO cards (card_name, owner, deck) VALUES (?, ?, ?)',
    [card_name, owner, deck],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to add card.' });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// API route: Delete a card
app.delete('/api/cards/:id', auth, (req, res) => {
  const { id } = req.params;
  db.get('SELECT owner, card_name, deck FROM cards WHERE id = ?', [id], (err, card) => {
    if (err || !card) return res.status(404).json({ error: 'Card not found.' });
    db.run('DELETE FROM cards WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({ error: 'Failed to delete card.' });
      res.json({ success: true });
    });
  });
});

// Registration sets approved=0
app.post('/api/register', express.json(), (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password.' });
  }
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (user) return res.status(409).json({ error: 'Username already exists.' });
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).json({ error: 'Failed to hash password.' });
      db.run('INSERT INTO users (username, password, approved) VALUES (?, ?, 0)', [username, hash], function (err) {
        if (err) return res.status(500).json({ error: 'Failed to register user.' });
        res.json({ success: true });
      });
    });
  });
});

// Login only allows approved users
app.post('/api/login', express.json(), (req, res) => {
  const { username, password } = req.body;
  console.log('[DEBUG] Login attempt:', { username });
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (!user || !user.approved) return res.status(401).json({ error: 'User not found or not approved.' });
    bcrypt.compare(password, user.password, (err, result) => {
      if (err || !result) return res.status(401).json({ error: 'Invalid password.' });
      const token = jwt.sign({ username: user.username, is_admin: !!user.is_admin }, SECRET, { expiresIn: '7d' });
      res.json({ token });
    });
  });
});

// Auth middleware
function auth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'Missing authorization header.' });
  const token = header.split(' ')[1];
  console.log('[DEBUG] Auth middleware: Incoming token:', token);
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.user = user;
    next();
  });
}

// Middleware to require admin
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) return res.status(403).json({ error: 'Admin access required.' });
  next();
}

// Admin endpoint to approve users
app.post('/api/admin/approve', express.json(), auth, (req, res) => {
  console.log('Approve user req.body:', req.body); // Debug log
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required.' });
  const { userId } = req.body;
  db.run('UPDATE users SET approved = 1 WHERE id = ?', [userId], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to approve user.' });
    res.json({ success: true });
  });
});

// Admin endpoint to list pending users
app.get('/api/admin/pending', auth, (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required.' });
  db.all('SELECT id, username FROM users WHERE approved = 0', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch pending users.' });
    res.json(rows);
  });
});

// Admin endpoint to list all users
app.get('/api/admin/users', auth, (req, res) => {
  console.log('Admin users endpoint:', req.user);
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required.' });
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch users.' });
    res.json(rows);
  });
});

// API: Add completed deck
app.post('/api/completed-decks', express.json(), auth, (req, res) => {
  const { deck, contributors, disposition, recipient } = req.body;
  if (!deck || !contributors || !disposition) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  db.run(
    'INSERT INTO completed_decks (deck, contributors, completed_at, disposition, recipient) VALUES (?, ?, ?, ?, ?)',
    [deck, JSON.stringify(contributors), new Date().toISOString(), disposition, recipient || null],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to add completed deck.' });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// API: Get completed decks
app.get('/api/completed-decks', auth, (req, res) => {
  db.all('SELECT * FROM completed_decks ORDER BY completed_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch completed decks.' });
    res.json(rows);
  });
});

// API: Submit deck request
app.post('/api/deck-requests', express.json(), auth, (req, res) => {
  const { deck } = req.body;
  const username = req.user.username;
  if (!deck) return res.status(400).json({ error: 'Missing deck.' });
  db.run(
    'INSERT INTO deck_requests (username, deck, requested_at, fulfilled) VALUES (?, ?, ?, 0)',
    [username, deck, new Date().toISOString()],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to submit deck request.' });
      res.json({ success: true, id: this.lastID });
    }
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
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch deck requests.' });
    res.json(rows);
  });
});

// API: Admin requests cards from users for a deck
app.post('/api/admin/request-cards', express.json(), auth, (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required.' });
  const { deck, cardRequests } = req.body; // cardRequests: [{username, card_name}]
  if (!deck || !cardRequests || !Array.isArray(cardRequests)) {
    return res.status(400).json({ error: 'Missing or invalid fields.' });
  }
  // For now, just log the requests (could be extended to notify users)
  // You may want to store these requests in a table for tracking
  res.json({ success: true, requested: cardRequests.length });
});

// API: Admin completes a deck (fulfill request or sell)
app.post('/api/admin/complete-deck', express.json(), auth, (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required.' });
  const { deck, contributors, disposition, recipient, salePrice } = req.body;
  if (!deck || !contributors || !disposition) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  let payouts = null;
  if (disposition === 'sold' && salePrice) {
    // TODO: Implement payout calculation logic
    payouts = {}; // Placeholder
  }
  db.run(
    'INSERT INTO completed_decks (deck, contributors, completed_at, disposition, recipient) VALUES (?, ?, ?, ?, ?)',
    [deck, JSON.stringify(contributors), new Date().toISOString(), disposition, recipient || null],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to complete deck.' });
      res.json({ success: true, id: this.lastID, payouts });
    }
  );
});

// Admin endpoint: Get completed but unallocated decks
app.get('/api/admin/completed-unallocated-decks', auth, (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required.' });
  db.all("SELECT * FROM completed_decks WHERE disposition IS NULL OR disposition NOT IN ('sold', 'fulfilled')", [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch unallocated decks.' });
    res.json(rows);
  });
});

// User profile endpoint
app.get('/api/profile', auth, (req, res) => {
  const username = req.user.username;
  db.all('SELECT * FROM cards WHERE owner = ?', [username], (err, cards) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch profile cards.' });
    res.json(cards);
  });
});

// API: Get notifications for user
app.get('/api/notifications', auth, (req, res) => {
  db.all('SELECT * FROM notifications WHERE username = ? ORDER BY created_at DESC', [req.user.username], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch notifications.' });
    res.json(rows);
  });
});

// API: Mark notification as read
app.post('/api/notifications/read', express.json(), auth, (req, res) => {
  const { id } = req.body;
  db.run('UPDATE notifications SET read = 1 WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to mark notification as read.' });
    res.json({ success: true });
  });
});

// CSV export/import endpoints
const csvStringify = (rows, columns) => {
  const header = columns.join(',');
  const data = rows.map(row => columns.map(col => JSON.stringify(row[col] ?? '')).join(',')).join('\n');
  return header + '\n' + data;
};

// Export all cards as CSV
app.get('/api/export/cards', auth, (req, res) => {
  db.all('SELECT * FROM cards', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to export cards.' });
    res.setHeader('Content-Type', 'text/csv');
    res.send(csvStringify(rows, ['id', 'card_name', 'owner', 'deck']));
  });
});

// Export all completed decks as CSV
app.get('/api/export/decks', auth, (req, res) => {
  db.all('SELECT * FROM completed_decks', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to export decks.' });
    res.setHeader('Content-Type', 'text/csv');
    res.send(csvStringify(rows, ['id', 'deck', 'contributors', 'completed_at', 'disposition', 'recipient']));
  });
});

// Get card history
app.get('/api/cards/:id/history', auth, (req, res) => {
  db.all('SELECT * FROM card_history WHERE card_id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch card history.' });
    res.json(rows);
  });
});

// Get deck history
app.get('/api/decks/:id/history', auth, (req, res) => {
  db.all('SELECT * FROM deck_history WHERE deck_id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch deck history.' });
    res.json(rows);
  });
});

// Admin: Get global activity log
app.get('/api/activity/all', auth, (req, res) => {
  console.log('Activity log request user:', req.user); // Debug log
  if (!req.user.is_admin) return res.json([]); // Always return array on error
  db.all('SELECT * FROM activity ORDER BY timestamp DESC LIMIT 50', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch activity log.' });
    res.json(rows);
  });
});

// User: Get own activity log
app.get('/api/activity', auth, (req, res) => {
  const username = req.user.username;
  db.all('SELECT * FROM activity WHERE username = ? ORDER BY timestamp DESC', [username], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch activity log.' });
    res.json(rows);
  });
});

// Gotify config endpoints
app.get('/api/gotify/config', auth, (req, res) => {
  const username = req.user.username;
  db.get('SELECT * FROM gotify_config WHERE username = ?', [username], (err, config) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch Gotify config.' });
    res.json(config);
  });
});

app.post('/api/gotify/config', express.json(), auth, (req, res) => {
  const { server, token, types } = req.body;
  const username = req.user.username;
  db.run('INSERT OR REPLACE INTO gotify_config (username, server, token, types) VALUES (?, ?, ?, ?)', [username, server, token, JSON.stringify(types)], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to save Gotify config.' });
    res.json({ success: true });
  });
});

// Notify user function (Discord + Gotify)
function notifyUser(username, type, message) {
  // Send Discord notification
  sendDiscordNotification(`[${type}] ${message}`);
  // Send Gotify notification
  sendGotifyNotification(username, type, message);
}

// Security Dashboard API endpoints
app.get('/api/admin/security-scan', auth, requireAdmin, (req, res) => {
  // Simulated security scan results
  const npmAudit = {
    summary: {
      issues: [
        { severity: 'high', description: 'Vulnerability in package XYZ', recommended_action: 'Update to version 2.0 or later' },
        { severity: 'medium', description: 'Deprecation warning for package ABC', recommended_action: 'Check package ABC for updates' }
      ],
      total_issues: 2,
      high: 1,
      medium: 1,
      low: 0
    },
    date: new Date().toISOString()
  };
  const ggshield = {
    summary: {
      issues: [],
      total_issues: 0,
      high: 0,
      medium: 0,
      low: 0
    },
    date: new Date().toISOString()
  };
  res.json({ npm_audit: npmAudit, ggshield });
});

app.get('/api/admin/dependency-status', auth, requireAdmin, (req, res) => {
  // Simulated dependency status
  const status = {
    total_dependencies: 42,
    outdated: 5,
    up_to_date: 37,
    details: [
      { package: 'express', current_version: '4.17.1', latest_version: '4.17.2', status: 'up_to_date' },
      { package: 'sqlite3', current_version: '5.0.2', latest_version: '5.0.2', status: 'up_to_date' },
      { package: 'jsonwebtoken', current_version: '8.5.1', latest_version: '9.0.0', status: 'outdated' }
    ]
  };
  res.json(status);
});

app.get('/api/admin/notification-history', auth, (req, res) => {
  db.all('SELECT * FROM notifications ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch notification history.' });
    res.json(rows);
  });
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'client', 'build')));

// API: Remove deck request (admin or user)
app.delete('/api/deck-requests/:id', express.json(), auth, (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM deck_requests WHERE id = ?', [id], (err, request) => {
    if (err || !request) return res.status(404).json({ error: 'Deck request not found.' });
    // Admin or user who made the request can delete
    if (!req.user.is_admin && request.username !== req.user.username) {
      return res.status(403).json({ error: 'Not authorized to delete this request.' });
    }
    db.run('DELETE FROM deck_requests WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({ error: 'Failed to delete deck request.' });
      res.json({ success: true });
    });
  });
});

// API: Delete a single notification
app.delete('/api/notifications/:id', auth, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM notifications WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete notification.' });
    res.json({ success: true });
  });
});

// API: Delete all notifications for user
app.delete('/api/notifications', auth, (req, res) => {
  const username = req.user.username;
  db.run('DELETE FROM notifications WHERE username = ?', [username], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete notifications.' });
    res.json({ success: true });
  });
});

// Remove user access (admin only)
app.post('/api/admin/remove-user', express.json(), auth, (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required.' });
  const { userId } = req.body;
  db.run('DELETE FROM users WHERE id = ?', [userId], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to remove user.' });
    res.json({ success: true });
  });
});

// Announcement endpoints
app.get('/api/announcements', auth, (req, res) => {
  db.all('SELECT * FROM announcement WHERE active = 1 AND (expiry IS NULL OR expiry > ?) ORDER BY id DESC', [new Date().toISOString()], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch announcements.' });
    res.json(rows);
  });
});

app.post('/api/announcements', express.json(), auth, (req, res) => {
  const { message, expiry, links } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }
  db.run('INSERT INTO announcement (message, expiry, links, active) VALUES (?, ?, ?, 1)', [message, expiry || null, JSON.stringify(links)], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to create announcement.' });
    res.json({ success: true, id: this.lastID });
  });
});

// API: Delete an announcement (admin only)
app.delete('/api/announcements/:id', auth, (req, res) => {
  const { id } = req.params;
  db.run('UPDATE announcement SET active = 0 WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete announcement.' });
    res.json({ success: true });
  });
});

// Announcement Endpoints
app.get('/api/announcement', async (req, res) => {
  try {
    console.log('API endpoint /api/announcement called');
    
    // Check if the announcement table exists
    const tableExists = await new Promise((resolve, reject) => {
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='announcement'", (err, row) => {
        if (err) {
          console.error('Error checking if table exists:', err);
          reject(err);
        } else {
          console.log('Table check result:', row);
          resolve(row ? true : false);
        }
      });
    });
    
    if (!tableExists) {
      console.log('Creating announcement table...');
      await new Promise((resolve, reject) => {
        db.run(`CREATE TABLE IF NOT EXISTS announcement (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          message TEXT NOT NULL,
          expiry TEXT,
          links TEXT,
          active INTEGER DEFAULT 1
        )`, (err) => {
          if (err) {
            console.error('Error creating table:', err);
            reject(err);
          } else {
            console.log('Table created successfully');
            resolve();
          }
        });
      });
    }
    
    // Get all active announcements that haven't expired
    const now = new Date().toISOString();
    const announcements = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM announcement WHERE active = 1 AND (expiry IS NULL OR expiry > ?) ORDER BY id DESC', 
        [now],
        (err, rows) => {
          if (err) {
            console.error('Error querying announcements:', err);
            reject(err);
          } else {
            console.log('Raw announcements from DB:', rows);
            resolve(rows || []);
          }
        }
      );
    });
    
    console.log('Fetched announcements:', announcements);
    
    // Parse links if they are stored as JSON strings
    announcements.forEach(announcement => {
      if (typeof announcement.links === 'string') {
        try {
          announcement.links = JSON.parse(announcement.links);
          console.log(`Parsed links for announcement ${announcement.id}:`, announcement.links);
        } catch (e) {
          console.error(`Error parsing announcement links for ID ${announcement.id}:`, e);
          announcement.links = [];
        }
      }
    });
    
    res.json(announcements);
  } catch (err) {
    console.error('Error fetching announcements:', err);
    res.status(500).json({ error: 'Failed to fetch announcements.' });
  }
});

app.post('/api/admin/announcement', requireAdmin, async (req, res) => {
  const { message, expiry, links, active } = req.body;
  
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message is required for announcements' });
  }
  
  try {
    // Format links properly
    const linksJson = Array.isArray(links) ? JSON.stringify(links) : JSON.stringify([]);
    
    // Log what we're inserting
    console.log('Creating announcement with:', { 
      message, 
      expiry: expiry || null, 
      links: linksJson,
      active: active !== false
    });
    
    await db.run(
      'INSERT INTO announcement (message, expiry, links, active) VALUES (?, ?, ?, ?)', 
      [message, expiry || null, linksJson, active !== false ? 1 : 0]
    );
    
    // Log success
    console.log('Announcement created successfully');
    
    // Add to activity log
    try {
      await db.run(
        'INSERT INTO activity_log (user_id, action, timestamp) VALUES (?, ?, ?)',
        [req.user.id, `Created announcement: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`, new Date().toISOString()]
      );
    } catch (logErr) {
      console.error('Failed to log announcement creation:', logErr);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to create announcement:', err);
    res.status(500).json({ error: 'Failed to create announcement.' });
  }
});

app.delete('/api/admin/announcement', requireAdmin, async (req, res) => {
  try {
    // Clear all active announcements
    console.log('Clearing all active announcements');
    await db.run('UPDATE announcement SET active = 0 WHERE active = 1');
    
    // Add to activity log
    try {
      await db.run(
        'INSERT INTO activity_log (user_id, action, timestamp) VALUES (?, ?, ?)',
        [req.user.id, 'Cleared all active announcements', new Date().toISOString()]
      );
    } catch (logErr) {
      console.error('Failed to log announcement clearing:', logErr);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to clear announcements:', err);
    res.status(500).json({ error: 'Failed to clear announcements.' });
  }
});

// Admin: Notification stats endpoint
app.get('/api/admin/notification-stats', auth, (req, res) => {
  // Only admins can access
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required.' });
  db.get('SELECT COUNT(*) as total FROM notifications', [], (err, totalRow) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch notification stats.' });
    db.get('SELECT COUNT(*) as unread FROM notifications WHERE read = 0', [], (err, unreadRow) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch unread notification count.' });
      res.json({ total: totalRow.total, unread: unreadRow.unread });
    });
  });
});

// Catch-all route to serve React index.html for non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
