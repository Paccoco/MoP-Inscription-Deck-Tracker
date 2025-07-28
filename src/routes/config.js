const express = require('express');
const { auth, requireAdmin } = require('../middleware/auth');
const { db } = require('../utils/database');
const { updateDiscordWebhookUrl, getDiscordWebhookUrl } = require('../services/notifications');

const router = express.Router();

// Discord webhook configuration
router.get('/discord/webhook', auth, (req, res) => {
  res.json({ webhookUrl: getDiscordWebhookUrl() });
});

router.post('/discord/webhook', auth, requireAdmin, (req, res) => {
  const { webhookUrl } = req.body;
  if (!webhookUrl || !/^https:\/\/discord(app)?\.com\/api\/webhooks\//.test(webhookUrl)) {
    return res.status(400).json({ error: 'Invalid Discord webhook URL.' });
  }
  
  updateDiscordWebhookUrl(webhookUrl);
  db.run('INSERT OR REPLACE INTO discord_webhook (id, url) VALUES (1, ?)', [webhookUrl], function (err) {
    if (err) {
      console.error('Error saving Discord webhook URL:', err);
      return res.status(500).json({ error: 'Failed to save webhook URL.' });
    }
    res.json({ success: true });
  });
});

// Gotify configuration endpoints
router.get('/gotify/config', auth, (req, res) => {
  db.get('SELECT * FROM gotify_config WHERE username = ?', [req.user.username], (err, config) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch Gotify config.' });
    res.json(config || {});
  });
});

router.post('/gotify/config', auth, (req, res) => {
  const { server, token } = req.body;
  if (!server || !token) {
    return res.status(400).json({ error: 'Server URL and token are required.' });
  }
  
  // Basic URL validation
  if (!/^https?:\/\//.test(server)) {
    return res.status(400).json({ error: 'Invalid server URL.' });
  }
  
  db.run(
    'INSERT OR REPLACE INTO gotify_config (username, server, token) VALUES (?, ?, ?)',
    [req.user.username, server, token],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to save Gotify config.' });
      res.json({ success: true });
    }
  );
});

router.delete('/gotify/config', auth, (req, res) => {
  db.run('DELETE FROM gotify_config WHERE username = ?', [req.user.username], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete Gotify config.' });
    res.json({ success: true });
  });
});

// Test Gotify connection
router.post('/gotify/test', auth, (req, res) => {
  db.get('SELECT * FROM gotify_config WHERE username = ?', [req.user.username], async (err, config) => {
    if (err || !config) {
      return res.status(400).json({ error: 'No Gotify configuration found.' });
    }
    
    try {
      const response = await fetch(`${config.server}/message?token=${config.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Notification',
          message: 'Gotify configuration test from MoP Card Tracker'
        })
      });
      
      if (response.ok) {
        res.json({ success: true, message: 'Test notification sent successfully.' });
      } else {
        res.status(400).json({ error: 'Failed to send test notification. Check your configuration.' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to connect to Gotify server.' });
    }
  });
});

module.exports = router;
