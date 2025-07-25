const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

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
    approved INTEGER DEFAULT 0,
    email TEXT,
    email_opt_in INTEGER DEFAULT 0
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
  // Create config table
  db.run(`CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);
});

// Log activity helper
function logActivity(username, action) {
  db.run('INSERT INTO activity (username, action, timestamp) VALUES (?, ?, ?)', [username, action, new Date().toISOString()]);
}

// Discord webhook integration
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';
let discordWebhookUrl = DISCORD_WEBHOOK_URL;

// Discord webhook config endpoints (persistent)
function getDiscordWebhookUrl(cb) {
  db.get('SELECT value FROM config WHERE key = "discord_webhook_url"', [], (err, row) => {
    cb(row ? row.value : '');
  });
}
function setDiscordWebhookUrl(url, cb) {
  db.run('INSERT OR REPLACE INTO config (key, value) VALUES ("discord_webhook_url", ?)', [url], cb);
}
app.get('/api/discord/webhook', auth, (req, res) => {
  getDiscordWebhookUrl(url => res.json({ webhookUrl: url }));
});
app.post('/api/discord/webhook', express.json(), auth, (req, res) => {
  const { webhookUrl } = req.body;
  if (!webhookUrl || !/^https:\/\/discord(app)?\.com\/api\/webhooks\//.test(webhookUrl)) {
    return res.status(400).json({ error: 'Invalid Discord webhook URL.' });
  }
  setDiscordWebhookUrl(webhookUrl, err => {
    if (err) return res.status(500).json({ error: 'Failed to save webhook URL.' });
    res.json({ success: true });
  });
});
function sendDiscordNotification(message) {
  getDiscordWebhookUrl(url => {
    if (!url) return;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message })
    });
  });
}

// Gotify notification integration
function getGotifyConfig(cb) {
  db.get('SELECT value FROM config WHERE key = "gotify_config"', [], (err, row) => {
    cb(row ? JSON.parse(row.value) : null);
  });
}
function setGotifyConfig(config, cb) {
  db.run('INSERT OR REPLACE INTO config (key, value) VALUES ("gotify_config", ?)', [JSON.stringify(config)], cb);
}
function sendGotifyNotification(title, message) {
  getGotifyConfig(cfg => {
    if (!cfg || !cfg.url || !cfg.token) return;
    fetch(`${cfg.url}/message?token=${cfg.token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message, priority: 5 })
    });
  });
}
app.get('/api/gotify/config', auth, (req, res) => {
  getGotifyConfig(cfg => res.json({ gotify: cfg }));
});
app.post('/api/gotify/config', express.json(), auth, (req, res) => {
  const { url, token } = req.body;
  if (!url || !token) return res.status(400).json({ error: 'Missing Gotify URL or token.' });
  setGotifyConfig({ url, token }, err => {
    if (err) return res.status(500).json({ error: 'Failed to save Gotify config.' });
    res.json({ success: true });
  });
});

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
      // Discord notification for card add
      // Define deck card lists (example, replace with actual deck lists)
      const deckCards = {
        'Ox Deck': ['Ox Card 1', 'Ox Card 2', 'Ox Card 3', 'Ox Card 4', 'Ox Card 5', 'Ox Card 6', 'Ox Card 7', 'Ox Card 8'],
        'Crane Deck': ['Crane Card 1', 'Crane Card 2', 'Crane Card 3', 'Crane Card 4', 'Crane Card 5', 'Crane Card 6', 'Crane Card 7', 'Crane Card 8'],
        // Add all deck types here
      };
      const allCards = deckCards[deck] || [];
      db.all('SELECT card_name FROM cards WHERE deck = ?', [deck], (err2, rows) => {
        if (!err2 && allCards.length) {
          const present = rows.map(r => r.card_name);
          const missing = allCards.filter(c => !present.includes(c));
          let msg = `${owner} added '${card_name}' to '${deck}'.\nMissing cards for this deck: ${missing.length ? missing.join(', ') : 'None! Deck complete.'}`;
          sendDiscordNotification(msg);
        }
      });
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
      res.json({ deleted: this.changes });
    });
  });
});

// Registration sets approved=0
app.post('/api/register', express.json(), (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (user) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).json({ error: 'Hashing error' });
      db.run('INSERT INTO users (username, password, email, approved) VALUES (?, ?, ?, 0)', [username, hash, email || null], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        // Send Gotify notification to admins
        sendGotifyNotification('New User Registration', `User '${username}' registered and is pending approval. Login to the admin panel to approve or deny.`);
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
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Admin endpoint to approve users
app.post('/api/admin/approve', auth, (req, res) => {
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
  db.all('SELECT id, username, is_admin FROM users', [], (err, rows) => {
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

// Email opt-in endpoint
app.post('/api/profile/email-opt-in', auth, (req, res) => {
  const { email, optIn } = req.body;
  db.run('UPDATE users SET email = ?, email_opt_in = ? WHERE username = ?', [email, optIn ? 1 : 0, req.user.username], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
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

// Analytics endpoints
app.get('/api/analytics/deck-completion', auth, (req, res) => {
  db.all('SELECT deck, COUNT(*) as completed FROM completed_decks GROUP BY deck', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.get('/api/analytics/contributors', auth, (req, res) => {
  db.all('SELECT owner, COUNT(*) as cards FROM cards GROUP BY owner', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'client/build')));

// Catch-all: serve index.html for any non-API route
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API route not found' });
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
