const express = require('express');
const { auth, requireAdmin } = require('../middleware/auth');
const { db, query } = require('../utils/database-adapter');
const { logActivity } = require('../utils/activity');
const log = require('../utils/logger');

const router = express.Router();

// Public API: Get current active announcement (no auth required)
router.get('/announcement', async (req, res) => {
  try {
    // API endpoint logging removed for production
    const announcement = await new Promise((resolve, reject) => {
      // Only select columns needed for announcement display
      db.get('SELECT id, message, expiry, links, active FROM announcement WHERE active = 1 ORDER BY id DESC LIMIT 1', [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (announcement && announcement.links) {
      try {
        announcement.links = JSON.parse(announcement.links);
      } catch (parseErr) {
        log.error('Failed to parse announcement links', parseErr);
        announcement.links = [];
      }
    }
    
    res.json(announcement || null);
  } catch (err) {
    log.error('Failed to fetch announcement', err);
    res.status(500).json({ error: 'Failed to fetch announcement.' });
  }
});

// User API: Get announcements (authenticated) - optimized query
router.get('/announcements', auth, (req, res) => {
  // Only select columns needed for announcements display
  db.all('SELECT id, message, expiry, links, active FROM announcement WHERE active = 1 ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch announcements.' });
    const announcements = rows.map(announcement => {
      if (announcement.links) {
        try {
          announcement.links = JSON.parse(announcement.links);
        } catch (parseErr) {
          announcement.links = [];
        }
      }
      return announcement;
    });
    res.json(announcements);
  });
});

// User API: Create announcement (authenticated users)
router.post('/announcements', auth, (req, res) => {
  const { message, expiry } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }
  
  db.run(
    'INSERT INTO announcement (message, expiry, active, created_by) VALUES (?, ?, 1, ?)',
    [message, expiry || null, req.user.username],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to create announcement.' });
      logActivity(req.user.username, `Created announcement: "${message.substring(0, 30)}..."`, new Date().toISOString());
      res.json({ success: true, id: this.lastID });
    }
  );
});

// User API: Delete own announcement
router.delete('/announcements/:id', auth, (req, res) => {
  const { id } = req.params;
  db.run('UPDATE announcement SET active = 0 WHERE id = ? AND created_by = ?', [id, req.user.username], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete announcement.' });
    if (this.changes === 0) {
      return res.status(403).json({ error: 'You can only delete your own announcements.' });
    }
    logActivity(req.user.username, `Deleted announcement ID: ${id}`, new Date().toISOString());
    res.json({ success: true });
  });
});

module.exports = router;
