const express = require('express');
const { auth } = require('../middleware/auth');
const { db, query } = require('../utils/database-adapter');
const { sendDiscordNotification, sendGotifyNotification } = require('../services/notifications');

const router = express.Router();

// API: Add completed deck
router.post('/completed-decks', auth, (req, res) => {
  const { deck, contributors, disposition, recipient } = req.body;
  if (!deck || !contributors || !disposition) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  db.run(
    'INSERT INTO completed_decks (deck, contributors, completed_at, disposition, recipient) VALUES (?, ?, ?, ?, ?)',
    [deck, JSON.stringify(contributors), new Date().toISOString(), disposition, recipient || null],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to add completed deck.' });
      
      // Send notifications
      const message = `Deck "${deck}" completed by ${contributors.join(', ')} - ${disposition}`;
      sendDiscordNotification(message);
      
      // Send Gotify notifications to contributors
      contributors.forEach(contributor => {
        sendGotifyNotification(contributor, 'Deck Completed', message);
      });
      
      res.json({ success: true, id: this.lastID });
    }
  );
});

// API: Get completed decks - optimized query
router.get('/completed-decks', auth, (req, res) => {
  // Only select the columns we need for completed decks display
  db.all('SELECT id, deck, contributors, completed_at, disposition, recipient FROM completed_decks ORDER BY completed_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch completed decks.' });
    // Parse contributors JSON
    const decks = rows.map(deck => ({
      ...deck,
      contributors: JSON.parse(deck.contributors || '[]')
    }));
    res.json(decks);
  });
});

// API: Delete completed deck
router.delete('/completed-decks/:id', auth, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM completed_decks WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete completed deck.' });
    res.json({ success: true });
  });
});

// API: Get user notifications - optimized query
router.get('/notifications', auth, (req, res) => {
  // Only select columns needed for notification display
  db.all(
    'SELECT id, username, message, created_at, read FROM notifications WHERE username = ? OR username = "system" ORDER BY created_at DESC LIMIT 50',
    [req.user.username],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch notifications.' });
      res.json(rows);
    }
  );
});

// API: Mark notification as read
router.patch('/notifications/:id/read', auth, (req, res) => {
  const { id } = req.params;
  db.run('UPDATE notifications SET read = 1 WHERE id = ? AND username = ?', [id, req.user.username], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to mark notification as read.' });
    res.json({ success: true });
  });
});

// API: Mark all notifications as read
router.patch('/notifications/read-all', auth, (req, res) => {
  db.run('UPDATE notifications SET read = 1 WHERE username = ? OR username = "system"', [req.user.username], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to mark all notifications as read.' });
    res.json({ success: true });
  });
});

// API: Delete notification
router.delete('/notifications/:id', auth, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM notifications WHERE id = ? AND username = ?', [id, req.user.username], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete notification.' });
    res.json({ success: true });
  });
});

// API: Delete all notifications for user
router.delete('/notifications', auth, (req, res) => {
  db.run('DELETE FROM notifications WHERE username = ?', [req.user.username], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete notifications.' });
    res.json({ success: true });
  });
});

// API: Get activity log - optimized query
router.get('/activity', auth, (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 100;
  // Only select columns needed for activity display
  db.all(
    'SELECT id, username, action, timestamp FROM activity ORDER BY timestamp DESC LIMIT ?',
    [limit],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch activity log.' });
      res.json(rows);
    }
  );
});

// API: Get activity for all users (admin only) - optimized query
router.get('/activity/all', auth, (req, res) => {
  // This should be admin-only in practice
  const limit = req.query.limit ? parseInt(req.query.limit) : 100;
  // Only select columns needed for activity display
  db.all(
    'SELECT id, username, action, timestamp FROM activity ORDER BY timestamp DESC LIMIT ?',
    [limit],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch activity log.' });
      res.json(rows);
    }
  );
});

// API: Add deck request
router.post('/deck-requests', auth, (req, res) => {
  const { deck, cards } = req.body;
  if (!deck || !cards || !Array.isArray(cards)) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  db.run(
    'INSERT INTO deck_requests (deck, cards, requested_by, requested_at) VALUES (?, ?, ?, ?)',
    [deck, JSON.stringify(cards), req.user.username, new Date().toISOString()],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to add deck request.' });
      
      // Send notification
      const message = `New deck request: "${deck}" by ${req.user.username}`;
      sendDiscordNotification(message);
      
      res.json({ success: true, id: this.lastID });
    }
  );
});

// API: Get deck requests - optimized query
router.get('/deck-requests', auth, (req, res) => {
  // Only select columns needed for deck requests display
  db.all('SELECT id, username, deck, requested_at, fulfilled, cards FROM deck_requests ORDER BY requested_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch deck requests.' });
    // Parse cards JSON
    const requests = rows.map(request => ({
      ...request,
      cards: JSON.parse(request.cards || '[]')
    }));
    res.json(requests);
  });
});

// API: Export cards - optimized query
router.get('/export/cards', auth, (req, res) => {
  // For export, we want all columns for data completeness
  db.all('SELECT id, card_name, owner, deck FROM cards', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to export cards.' });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="cards-export.json"');
    res.json(rows);
  });
});

// API: Export decks - optimized query
router.get('/export/decks', auth, (req, res) => {
  // For export, we want all columns for data completeness
  db.all('SELECT id, deck, contributors, completed_at, disposition, recipient FROM completed_decks', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to export decks.' });
    const decks = rows.map(deck => ({
      ...deck,
      contributors: JSON.parse(deck.contributors || '[]')
    }));
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="decks-export.json"');
    res.json(decks);
  });
});

// API: Get card history - optimized query
router.get('/cards/:id/history', auth, (req, res) => {
  const { id } = req.params;
  // Only select columns needed for card history display
  db.all('SELECT id, card_id, action, timestamp, user_id FROM card_history WHERE card_id = ? ORDER BY timestamp DESC', [id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch card history.' });
    res.json(rows);
  });
});

// API: Get deck history - optimized query
router.get('/decks/:id/history', auth, (req, res) => {
  const { id } = req.params;
  // Only select columns needed for deck history display
  db.all('SELECT id, deck_id, action, timestamp, user_id FROM deck_history WHERE deck_id = ? ORDER BY timestamp DESC', [id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch deck history.' });
    res.json(rows);
  });
});

// API: Delete deck request
router.delete('/deck-requests/:id', auth, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM deck_requests WHERE id = ? AND requested_by = ?', [id, req.user.username], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete deck request.' });
    res.json({ success: true });
  });
});

module.exports = router;
