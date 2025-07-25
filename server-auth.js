const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

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
});

// Log activity helper
function logActivity(username, action) {
  db.run(
    'INSERT INTO activity (username, action, timestamp) VALUES (?, ?, ?)',
    [username, action, new Date().toISOString()],
    function (err) {
      if (err) {
        console.error('Activity log DB error:', err.message);
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
    if (!err && row && row.url) {
      discordWebhookUrl = row.url;
      console.log('Loaded Discord webhook URL from DB:', discordWebhookUrl);
    } else {
      discordWebhookUrl = DISCORD_WEBHOOK_URL;
      console.log('Using default Discord webhook URL:', discordWebhookUrl);
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
      console.error('Failed to save Discord webhook URL:', err.message);
      return res.status(500).json({ error: 'Failed to save Discord webhook URL.' });
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
  });
}

// Send Gotify notification
function sendGotifyNotification(username, type, message) {
  db.get('SELECT * FROM gotify_config WHERE username = ?', [username], (err, config) => {
    if (err || !config || !config.server || !config.token) return;
    let enabled = [];
    try { enabled = JSON.parse(config.types || '[]'); } catch {}
    if (!enabled.includes(type)) return;
    fetch(`${config.server}/message?token=${config.token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'MoP Card Tracker', message })
    });
  });
}

// API route: Get all cards
app.get('/api/cards', (req, res) => {
  db.all('SELECT * FROM cards', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// API route: Add a card
app.post('/api/cards', express.json(), auth, (req, res) => {
  const { card_name, deck } = req.body;
  const owner = req.user.username;
  if (!card_name || !owner || !deck) {
    console.error('Add card error: Missing fields', { card_name, owner, deck });
    return res.status(400).json({ error: 'Missing fields' });
  }
  db.run(
    'INSERT INTO cards (card_name, owner, deck) VALUES (?, ?, ?)',
    [card_name, owner, deck],
    function (err) {
      if (err) {
        console.error('Add card DB error:', err.message);
        return res.status(500).json({ error: err.message });
      }
      logActivity(owner, `Added card '${card_name}' to deck '${deck}'`);
      sendDiscordNotification(`Card added: '${card_name}' to deck '${deck}' by ${owner}`);
      res.json({ id: this.lastID, card_name, owner, deck });
    }
  );
});

// API route: Delete a card
app.delete('/api/cards/:id', auth, (req, res) => {
  const { id } = req.params;
  db.get('SELECT owner, card_name, deck FROM cards WHERE id = ?', [id], (err, card) => {
    if (err || !card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    if (req.user.username !== card.owner && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized to delete this card' });
    }
    db.run('DELETE FROM cards WHERE id = ?', [id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      logActivity(card.owner, `Removed card '${card.card_name}' from deck '${card.deck}'`);
      sendDiscordNotification(`Card removed: '${card.card_name}' from deck '${card.deck}' by ${card.owner}`);
      res.json({ deleted: this.changes });
    });
  });
});

// Registration sets approved=0
app.post('/api/register', express.json(), (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (user) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).json({ error: 'Hashing error' });
      db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        // Notify all admins
        db.all('SELECT username FROM users WHERE is_admin = 1', [], (err2, admins) => {
          if (!err2 && admins) {
            admins.forEach(a => {
              notifyUser(a.username, 'approval', `New user '${username}' registered and needs approval.`);
            });
          }
        });
        res.json({ success: true });
      });
    });
  });
});

// Login only allows approved users
app.post('/api/login', express.json(), (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) {
      console.error('Login error: Invalid credentials', { username });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.approved) {
      console.error('Login error: Account not approved', { username });
      return res.status(403).json({ error: 'Account not approved by admin yet.' });
    }
    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        const token = jwt.sign({ id: user.id, username: user.username, is_admin: !!user.is_admin }, SECRET, { expiresIn: '1d' });
        res.json({ token });
      } else {
        console.error('Login error: Invalid password', { username });
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });
  });
});

// Auth middleware
function auth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) {
    console.error('Auth failed: No Authorization header');
    return res.status(401).json({ error: 'Invalid token' });
  }
  const token = header.split(' ')[1];
  console.log('Auth middleware: Incoming token:', token);
  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      console.error('Auth failed: JWT error', err.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = user;
    console.log('Auth success:', user);
    next();
  });
}

// Admin endpoint to approve users
app.post('/api/admin/approve', express.json(), auth, (req, res) => {
  console.log('Approve user req.body:', req.body); // Debug log
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin only' });
  const { userId } = req.body;
  db.run('UPDATE users SET approved = 1 WHERE id = ?', [userId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    // Send notification to user
    db.get('SELECT username FROM users WHERE id = ?', [userId], (err2, user) => {
      if (user) {
        // Approve user notification
        db.run('INSERT INTO notifications (username, message, read, created_at) VALUES (?, ?, 0, ?)', [user.username, 'Your account has been approved by an admin.', new Date().toISOString()]);
      }
    });
    res.json({ success: true });
  });
});

// Admin endpoint to list pending users
app.get('/api/admin/pending', auth, (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin only' });
  db.all('SELECT id, username FROM users WHERE approved = 0', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Admin endpoint to list all users
app.get('/api/admin/users', auth, (req, res) => {
  console.log('Admin users endpoint:', req.user);
  if (!req.user.is_admin) {
    console.log('Not admin:', req.user);
    return res.status(403).json({ error: 'Admin only' });
  }
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// API: Add completed deck
app.post('/api/completed-decks', express.json(), auth, (req, res) => {
  const { deck, contributors, disposition, recipient } = req.body;
  if (!deck || !contributors || !disposition) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  db.run(
    'INSERT INTO completed_decks (deck, contributors, completed_at, disposition, recipient) VALUES (?, ?, ?, ?, ?)',
    [deck, JSON.stringify(contributors), new Date().toISOString(), disposition, recipient || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      contributors.forEach(c => logActivity(c.owner, `Contributed to completed deck '${deck}' (${disposition})`));
      sendDiscordNotification(`Deck completed: ${deck} by ${contributors.map(c => c.owner).join(', ')}`);
      res.json({ id: this.lastID });
    }
  );
});

// API: Get completed decks
app.get('/api/completed-decks', auth, (req, res) => {
  db.all('SELECT * FROM completed_decks ORDER BY completed_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Parse contributors JSON
    rows.forEach(row => { row.contributors = JSON.parse(row.contributors); });
    res.json(rows);
  });
});

// API: Submit deck request
app.post('/api/deck-requests', express.json(), auth, (req, res) => {
  const { deck } = req.body;
  const username = req.user.username;
  if (!deck) return res.status(400).json({ error: 'Missing deck' });
  db.run(
    'INSERT INTO deck_requests (username, deck, requested_at, fulfilled) VALUES (?, ?, ?, 0)',
    [username, deck, new Date().toISOString()],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      sendDiscordNotification(`Deck requested: ${deck} by ${username}`);
      res.json({ id: this.lastID });
    }
  );
});

// API: Get deck requests ordered by contribution
app.get('/api/deck-requests', auth, (req, res) => {
  db.all(`
    SELECT r.*, IFNULL(c.count,0) as contribution
    FROM deck_requests r
    LEFT JOIN (
      SELECT owner, COUNT(*) as count FROM cards GROUP BY owner
    ) c ON r.username = c.owner
    ORDER BY r.fulfilled ASC, contribution DESC, r.requested_at ASC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// API: Admin requests cards from users for a deck
app.post('/api/admin/request-cards', express.json(), auth, (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin only' });
  const { deck, cardRequests } = req.body; // cardRequests: [{username, card_name}]
  if (!deck || !cardRequests || !Array.isArray(cardRequests)) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  // For now, just log the requests (could be extended to notify users)
  // You may want to store these requests in a table for tracking
  res.json({ success: true, requested: cardRequests.length });
});

// API: Admin completes a deck (fulfill request or sell)
app.post('/api/admin/complete-deck', express.json(), auth, (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin only' });
  const { deck, contributors, disposition, recipient, salePrice } = req.body;
  if (!deck || !contributors || !disposition) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  let payouts = null;
  if (disposition === 'sold' && salePrice) {
    // Calculate payouts
    const total = contributors.length;
    const byOwner = {};
    contributors.forEach(c => {
      byOwner[c.owner] = (byOwner[c.owner] || 0) + 1;
    });
    const guildCut = salePrice * 0.05;
    const net = salePrice - guildCut;
    payouts = Object.entries(byOwner).map(([owner, count]) => ({
      owner,
      payout: parseFloat(((count/total) * net).toFixed(2))
    }));
  }
  db.run(
    'INSERT INTO completed_decks (deck, contributors, completed_at, disposition, recipient) VALUES (?, ?, ?, ?, ?)',
    [deck, JSON.stringify(contributors), new Date().toISOString(), disposition, recipient || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      contributors.forEach(c => logActivity(c.owner, `Contributed to completed deck '${deck}' (${disposition})`));
      logActivity(req.user.username, `Completed deck '${deck}' (${disposition})`);
      // Send notifications to contributors
      contributors.forEach(c => {
        let msg = disposition === 'sold'
          ? `Deck '${deck}' was sold. You received a payout.`
          : `Deck '${deck}' was fulfilled.`;
        db.run('INSERT INTO notifications (username, message, read, created_at) VALUES (?, ?, 0, ?)', [c.owner, msg, new Date().toISOString()]);
      });
      if (disposition === 'sold' && payouts) {
        payouts.forEach(p => {
          db.run('INSERT INTO notifications (username, message, read, created_at) VALUES (?, ?, 0, ?)', [p.owner, `You received ${p.payout} gold for deck '${deck}'.`, new Date().toISOString()]);
        });
      }
      sendDiscordNotification(`Deck ${disposition}: ${deck} by ${contributors.map(c => c.owner).join(', ')}`);
      res.json({ id: this.lastID, payouts, guildCut: disposition === 'sold' ? parseFloat((salePrice * 0.05).toFixed(2)) : null });
    }
  );
});

// Admin endpoint: Get completed but unallocated decks
app.get('/api/admin/completed-unallocated-decks', auth, (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin only' });
  db.all("SELECT * FROM completed_decks WHERE disposition IS NULL OR disposition NOT IN ('sold', 'fulfilled')", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    rows.forEach(row => { row.contributors = JSON.parse(row.contributors); });
    res.json(rows);
  });
});

// User profile endpoint
app.get('/api/profile', auth, (req, res) => {
  const username = req.user.username;
  db.all('SELECT * FROM cards WHERE owner = ?', [username], (err, cards) => {
    if (err) return res.status(500).json({ error: err.message });
    db.all('SELECT * FROM completed_decks WHERE contributors LIKE ?', [`%${username}%`], (err2, completedDecks) => {
      if (err2) return res.status(500).json({ error: err2.message });
      // Payouts: find decks where disposition is 'sold' and user is a contributor
      const payouts = completedDecks.filter(d => d.disposition === 'sold').map(d => {
        let contribs = JSON.parse(d.contributors);
        let count = contribs.filter(c => c.owner === username).length;
        let total = contribs.length;
        let salePrice = d.salePrice || 0;
        let guildCut = salePrice * 0.05;
        let net = salePrice - guildCut;
        let amount = total ? ((count/total) * net).toFixed(2) : 0;
        return { deck: d.deck, amount };
      });
      // Activity log: last 10 actions (card add/remove, deck complete)
      db.all('SELECT * FROM activity WHERE username = ? ORDER BY timestamp DESC LIMIT 10', [username], (err3, activityRows) => {
        let activity = activityRows ? activityRows.map(a => a.action) : [];
        res.json({ username, cards, completedDecks, payouts, activity });
      });
    });
  });
});

// API: Get notifications for user
app.get('/api/notifications', auth, (req, res) => {
  db.all('SELECT * FROM notifications WHERE username = ? ORDER BY created_at DESC', [req.user.username], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// API: Mark notification as read
app.post('/api/notifications/read', express.json(), auth, (req, res) => {
  const { id } = req.body;
  db.run('UPDATE notifications SET read = 1 WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
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
    if (err) return res.status(500).json({ error: err.message });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="cards.csv"');
    res.send(csvStringify(rows, ['id','card_name','owner','deck']));
  });
});

// Export all completed decks as CSV
app.get('/api/export/decks', auth, (req, res) => {
  db.all('SELECT * FROM completed_decks', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="decks.csv"');
    res.send(csvStringify(rows, ['id','deck','contributors','completed_at','disposition','recipient']));
  });
});

// Get card history
app.get('/api/cards/:id/history', auth, (req, res) => {
  db.all('SELECT * FROM card_history WHERE card_id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get deck history
app.get('/api/decks/:id/history', auth, (req, res) => {
  db.all('SELECT * FROM deck_history WHERE deck_id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Admin: Get global activity log
app.get('/api/activity/all', auth, (req, res) => {
  console.log('Activity log request user:', req.user); // Debug log
  if (!req.user.is_admin) return res.status(403).json([]); // Always return array on error
  db.all('SELECT * FROM activity ORDER BY timestamp DESC LIMIT 50', [], (err, rows) => {
    if (err || !Array.isArray(rows)) return res.json([]); // Always return array on error
    // Map to expected format for Admin.js
    const mapped = rows.map(a => ({ message: a.action, created_at: a.timestamp }));
    res.json(mapped);
  });
});

// User: Get own activity log
app.get('/api/activity', auth, (req, res) => {
  db.all('SELECT * FROM activity WHERE username = ? ORDER BY timestamp DESC LIMIT 10', [req.user.username], (err, rows) => {
    if (err || !Array.isArray(rows)) return res.json([]);
    res.json(rows);
  });
});

// Gotify config endpoints
app.get('/api/gotify/config', auth, (req, res) => {
  db.get('SELECT * FROM gotify_config WHERE username = ?', [req.user.username], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || { server: '', token: '', types: [] });
  });
});

app.post('/api/gotify/config', express.json(), auth, (req, res) => {
  const { server, token, types } = req.body;
  console.log('Gotify config POST:', { user: req.user.username, server, token, types });
  db.run('INSERT OR REPLACE INTO gotify_config (username, server, token, types) VALUES (?, ?, ?, ?)',
    [req.user.username, server, token, JSON.stringify(types || [])],
    function (err) {
      if (err) {
        console.error('Gotify config DB error:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log('Gotify config saved for', req.user.username);
      res.json({ success: true });
    });
});

// Notify user function (Discord + Gotify)
function notifyUser(username, type, message) {
  console.log('notifyUser:', { username, type, message });
  db.run('INSERT INTO notifications (username, message, read, created_at) VALUES (?, ?, 0, ?)', [username, message, new Date().toISOString()], function (err) {
    if (err) console.error('Notification DB error:', err.message);
  });
  sendGotifyNotification(username, type, message);
}

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'client', 'build')));

// Catch-all route to serve React index.html for non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

// API: Remove deck request (admin or user)
app.delete('/api/deck-requests/:id', express.json(), auth, (req, res) => {
  const requestId = req.params.id;
  const { reason } = req.body || {};
  db.get('SELECT * FROM deck_requests WHERE id = ?', [requestId], (err, request) => {
    if (err || !request) return res.status(404).json({ error: 'Request not found' });
    const isAdmin = !!req.user.is_admin;
    const isOwner = req.user.username === request.username;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Not authorized to remove this request' });
    }
    db.run('DELETE FROM deck_requests WHERE id = ?', [requestId], function (err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      logActivity(req.user.username, `Removed deck request for '${request.deck}'${isAdmin ? ` (admin)` : ''}`);
      if (isAdmin && reason) {
        // Notify user with reason
        db.run('INSERT INTO notifications (username, message, read, created_at) VALUES (?, ?, 0, ?)', [request.username, `Your deck request for '${request.deck}' was removed by an admin. Reason: ${reason}`, new Date().toISOString()]);
        sendDiscordNotification(`Admin removed deck request for '${request.deck}' by ${request.username}. Reason: ${reason}`);
        sendGotifyNotification(request.username, 'deck_request_removed', `Your deck request for '${request.deck}' was removed by an admin. Reason: ${reason}`);
      }
      res.json({ deleted: this.changes });
    });
  });
});

// API: Delete a single notification
app.delete('/api/notifications/:id', auth, (req, res) => {
  db.run('DELETE FROM notifications WHERE id = ? AND username = ?', [req.params.id, req.user.username], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// API: Delete all notifications for user
app.delete('/api/notifications', auth, (req, res) => {
  db.run('DELETE FROM notifications WHERE username = ?', [req.user.username], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
