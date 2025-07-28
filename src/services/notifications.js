const fetch = require('node-fetch');
const db = require('../utils/database-adapter');
const log = require('../utils/logger');

// Discord webhook configuration
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';
let discordWebhookUrl = DISCORD_WEBHOOK_URL;

// Initialize Discord webhook table - PostgreSQL compatible
async function initializeDiscordWebhook() {
  try {
    // Check if using PostgreSQL (which already has discord_config table) or SQLite
    const dbType = process.env.DB_TYPE || 'sqlite';
    
    if (dbType === 'postgresql') {
      // PostgreSQL already has discord_config table from schema
      await loadDiscordWebhookUrl();
    } else {
      // SQLite fallback - create table if needed
      await db.run(`CREATE TABLE IF NOT EXISTS discord_webhook (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        url TEXT
      )`);
      await loadDiscordWebhookUrl();
    }
  } catch (err) {
    log.error('Error initializing Discord webhook', err);
  }
}

// Load webhook from database - adapter compatible
async function loadDiscordWebhookUrl() {
  try {
    const dbType = process.env.DB_TYPE || 'sqlite';
    
    if (dbType === 'postgresql') {
      // Use PostgreSQL discord_config table
      const rows = await db.query('SELECT webhook_url FROM discord_config WHERE enabled = true LIMIT 1');
      if (rows.length > 0 && rows[0].webhook_url) {
        discordWebhookUrl = rows[0].webhook_url;
      }
    } else {
      // Use SQLite discord_webhook table
      const row = await db.get('SELECT url FROM discord_webhook WHERE id = 1');
      if (row && row.url) {
        discordWebhookUrl = row.url;
      }
    }
  } catch (err) {
    log.error('Error loading Discord webhook URL', err);
  }
}

// Get Discord webhook URL
function getDiscordWebhookUrl() {
  return discordWebhookUrl;
}

// Save Discord webhook URL - adapter compatible
async function saveDiscordWebhookUrl(webhookUrl, callback) {
  if (!webhookUrl || !/^https:\/\/discord(app)?\.com\/api\/webhooks\//.test(webhookUrl)) {
    return callback(new Error('Invalid Discord webhook URL.'));
  }
  
  try {
    const dbType = process.env.DB_TYPE || 'sqlite';
    discordWebhookUrl = webhookUrl;
    
    if (dbType === 'postgresql') {
      // Use PostgreSQL discord_config table - simplified approach
      await db.query('UPDATE discord_config SET webhook_url = $1 WHERE id = (SELECT id FROM discord_config LIMIT 1)', [webhookUrl]);
    } else {
      // Use SQLite discord_webhook table
      await db.run('INSERT OR REPLACE INTO discord_webhook (id, url) VALUES (1, ?)', [webhookUrl]);
    }
    
    if (callback) callback(null);
  } catch (err) {
    log.error('Error saving Discord webhook URL', err);
    if (callback) callback(err);
  }
}

// Send Gotify notification - adapter compatible
async function sendGotifyNotification(username, type, message) {
  try {
    const dbType = process.env.DB_TYPE || 'sqlite';
    let config;
    
    if (dbType === 'postgresql') {
      // Use PostgreSQL gotify_config table with user join
      const rows = await db.query(`
        SELECT gc.server_url as server, gc.app_token as token 
        FROM gotify_config gc 
        JOIN users u ON u.id = gc.user_id 
        WHERE u.username = $1 AND gc.enabled = true
      `, [username]);
      config = rows.length > 0 ? { server: rows[0].server, token: rows[0].token } : null;
    } else {
      // Use SQLite gotify_config table
      config = await db.get('SELECT * FROM gotify_config WHERE username = ?', [username]);
    }
    
    if (!config || !config.server || !config.token) return;
    
    const response = await fetch(`${config.server}/message?token=${config.token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: type, message })
    });
    
    if (!response.ok) {
      log.error(`Gotify notification failed: ${response.statusText}`);
    }
  } catch (err) {
    log.error('Gotify notification error', err);
  }
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
        log.error(`Discord notification failed: ${res.statusText}`);
      }
    })
    .catch(err => {
      log.error('Discord notification error', err);
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
