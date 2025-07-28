const express = require('express');
const bcrypt = require('bcrypt');
const { auth, requireAdmin } = require('../middleware/auth');
const { db, query } = require('../utils/database-adapter');
const { logActivity } = require('../utils/activity');
const { sendDiscordNotification } = require('../services/notifications');

const router = express.Router();

// Admin endpoint to approve users
router.post('/admin/approve', auth, requireAdmin, (req, res) => {
  const { userId } = req.body;
  db.run('UPDATE users SET approved = 1 WHERE id = ?', [userId], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to approve user.' });
    logActivity(req.user.username, `Approved user ID: ${userId}`, new Date().toISOString());
    res.json({ success: true });
  });
});

// Admin endpoint to list pending users
router.get('/admin/pending', auth, requireAdmin, (req, res) => {
  db.all('SELECT id, username FROM users WHERE approved = 0', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch pending users.' });
    res.json(rows);
  });
});

// Admin endpoint to list all users
router.get('/admin/users', auth, requireAdmin, (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch users.' });
    res.json(rows);
  });
});

// Admin: Role management endpoints
router.post('/admin/roles', auth, requireAdmin, (req, res) => {
  const { userId, isAdmin } = req.body;
  if (typeof isAdmin !== 'boolean') {
    return res.status(400).json({ error: 'isAdmin must be a boolean value.' });
  }
  db.run('UPDATE users SET is_admin = ? WHERE id = ?', [isAdmin ? 1 : 0, userId], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to update user role.' });
    logActivity(req.user.username, `Updated user ${userId} admin status to: ${isAdmin}`, new Date().toISOString());
    res.json({ success: true });
  });
});

// Admin: Delete user
router.delete('/admin/users/:userId', auth, requireAdmin, (req, res) => {
  const { userId } = req.params;
  db.run('DELETE FROM users WHERE id = ?', [userId], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete user.' });
    logActivity(req.user.username, `Deleted user ID: ${userId}`, new Date().toISOString());
    res.json({ success: true });
  });
});

// Admin: Reset user password
router.post('/admin/reset-password', auth, requireAdmin, async (req, res) => {
  const { userId, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }
  
  try {
    const hash = await bcrypt.hash(newPassword, 10);
    db.run('UPDATE users SET password = ? WHERE id = ?', [hash, userId], function (err) {
      if (err) return res.status(500).json({ error: 'Failed to reset password.' });
      logActivity(req.user.username, `Reset password for user ID: ${userId}`, new Date().toISOString());
      res.json({ success: true });
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to hash password.' });
  }
});

// Admin: Announcement management
router.get('/admin/announcement', auth, requireAdmin, async (req, res) => {
  try {
    const announcement = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM announcement WHERE active = 1 ORDER BY id DESC LIMIT 1', [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    res.json(announcement || null);
  } catch (err) {
    console.error('Failed to fetch announcement:', err);
    res.status(500).json({ error: 'Failed to fetch announcement.' });
  }
});

router.post('/admin/announcement', auth, requireAdmin, async (req, res) => {
  try {
    const { message, expiry, links, active } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required.' });
    }
    
    // Validate and process links
    let linksJson = '[]';
    if (links && Array.isArray(links) && links.length > 0) {
      const validLinks = links.filter(link => link.text && link.url);
      linksJson = JSON.stringify(validLinks);
    }
    
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO announcement (message, expiry, links, active) VALUES (?, ?, ?, ?)', 
        [message, expiry || null, linksJson, active !== false ? 1 : 0],
        function (err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });
    
    logActivity(req.user.username, `Created announcement: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`, new Date().toISOString());
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to create announcement:', err);
    res.status(500).json({ error: 'Failed to create announcement.' });
  }
});

router.delete('/admin/announcement', auth, requireAdmin, async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      db.run('UPDATE announcement SET active = 0 WHERE active = 1', [], function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
    
    logActivity(req.user.username, 'Cleared all active announcements', new Date().toISOString());
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to clear announcements:', err);
    res.status(500).json({ error: 'Failed to clear announcements.' });
  }
});

// Admin: Notification stats
router.get('/admin/notification-stats', auth, requireAdmin, (req, res) => {
  db.get('SELECT COUNT(*) as total FROM notifications', [], (err, totalRow) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch notification stats.' });
    db.get('SELECT COUNT(*) as unread FROM notifications WHERE read = 0', [], (err, unreadRow) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch unread notification count.' });
      res.json({ total: totalRow.total, unread: unreadRow.unread });
    });
  });
});

// Admin: Request cards for deck
router.post('/admin/request-cards', auth, requireAdmin, (req, res) => {
  const { deck, cards } = req.body;
  if (!deck || !cards || !Array.isArray(cards)) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  db.run(
    'INSERT INTO deck_requests (deck, cards, requested_by, requested_at) VALUES (?, ?, ?, ?)',
    [deck, JSON.stringify(cards), req.user.username, new Date().toISOString()],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to add deck request.' });
      logActivity(req.user.username, `Requested cards for deck: ${deck}`, new Date().toISOString());
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Admin: Complete deck
router.post('/admin/complete-deck', auth, requireAdmin, (req, res) => {
  const { deck, contributors, disposition, recipient } = req.body;
  if (!deck || !contributors || !disposition) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  db.run(
    'INSERT INTO completed_decks (deck, contributors, completed_at, disposition, recipient) VALUES (?, ?, ?, ?, ?)',
    [deck, JSON.stringify(contributors), new Date().toISOString(), disposition, recipient || null],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to complete deck.' });
      
      logActivity(req.user.username, `Completed deck: ${deck}`, new Date().toISOString());
      
      // Send notifications
      const message = `Deck "${deck}" completed by admin ${req.user.username} - ${disposition}`;
      sendDiscordNotification(message);
      
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Admin: Get completed unallocated decks
router.get('/admin/completed-unallocated-decks', auth, requireAdmin, (req, res) => {
  db.all(
    'SELECT * FROM completed_decks WHERE disposition = "unallocated" ORDER BY completed_at DESC',
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch unallocated decks.' });
      const decks = rows.map(deck => ({
        ...deck,
        contributors: JSON.parse(deck.contributors || '[]')
      }));
      res.json(decks);
    }
  );
});

// Admin: Notification history
router.get('/admin/notification-history', auth, requireAdmin, (req, res) => {
  db.all('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch notification history.' });
    res.json(rows);
  });
});

// Admin: Remove user (alternative to delete)
router.post('/admin/remove-user', auth, requireAdmin, (req, res) => {
  const { userId } = req.body;
  db.run('DELETE FROM users WHERE id = ?', [userId], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to remove user.' });
    logActivity(req.user.username, `Removed user ID: ${userId}`, new Date().toISOString());
    res.json({ success: true });
  });
});

module.exports = router;
