const fetch = require('node-fetch');
const { db } = require('../utils/database');

// Discord webhook configuration
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';
let discordWebhookUrl = DISCORD_WEBHOOK_URL;

// Initialize Discord webhook table
function initializeDiscordWebhook() {
  // Ensure discord_webhook table exists
  // Only one row: {id: 1, url: webhookUrl}
  db.run(`CREATE TABLE IF NOT EXISTS discord_webhook (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    url TEXT
  )`);
  
  // Load webhook from DB on startup
  loadDiscordWebhookUrl();
}

// Load webhook from database
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

// Get Discord webhook URL
function getDiscordWebhookUrl() {
  return discordWebhookUrl;
}

// Save Discord webhook URL
function saveDiscordWebhookUrl(webhookUrl, callback) {
  if (!webhookUrl || !/^https:\/\/discord(app)?\.com\/api\/webhooks\//.test(webhookUrl)) {
    return callback(new Error('Invalid Discord webhook URL.'));
  }
  
  discordWebhookUrl = webhookUrl;
  db.run('INSERT OR REPLACE INTO discord_webhook (id, url) VALUES (1, ?)', [webhookUrl], callback);
}

// Send Discord notification
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

// Update Discord webhook URL in memory
function updateDiscordWebhookUrl(url) {
  discordWebhookUrl = url;
}

module.exports = {
  initializeDiscordWebhook,
  getDiscordWebhookUrl,
  updateDiscordWebhookUrl,
  saveDiscordWebhookUrl,
  sendDiscordNotification,
  sendGotifyNotification
};
