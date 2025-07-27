require('dotenv').config();
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

// Initialize SQLite database
let db;
const dbPath = path.join(__dirname, 'cards.db');
try {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      process.exit(1);
    }
    console.log('Connected to SQLite database at', dbPath);
  });
  
  // Enable foreign keys and WAL mode for better performance
  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA journal_mode = WAL');
} catch (err) {
  console.error('Failed to initialize database:', err);
  process.exit(1);
}

// Ensure admin user exists on startup
async function ensureAdminExists() {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminUsername || !adminPassword) {
    console.warn('Admin credentials not found in environment variables');
    return;
  }

  try {
    const hash = await bcrypt.hash(adminPassword, 10);
    db.get('SELECT * FROM users WHERE username = ?', [adminUsername], (err, user) => {
      if (err) {
        console.error('Error checking admin user:', err);
        return;
      }

      if (user) {
        // Update existing admin
        db.run(
          'UPDATE users SET password = ?, is_admin = 1, approved = 1 WHERE username = ?',
          [hash, adminUsername],
          (err) => {
            if (err) console.error('Error updating admin user:', err);
            else console.log('Admin user updated successfully');
          }
        );
      } else {
        // Create new admin
        db.run(
          'INSERT INTO users (username, password, is_admin, approved) VALUES (?, ?, 1, 1)',
          [adminUsername, hash],
          (err) => {
            if (err) console.error('Error creating admin user:', err);
            else console.log('Admin user created successfully');
          }
        );
      }
    });
  } catch (err) {
    console.error('Error ensuring admin exists:', err);
  }
}

// Initialize middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, 'client/build')));

// Handle React routing by serving index.html for any non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Create API router with middleware to log requests
const apiRouter = express.Router();
apiRouter.use((req, res, next) => {
  console.log(`API Request: ${req.method} ${req.originalUrl}`);
  next();
});

// Helper function to compare versions (handles pre-releases)
function compareVersions(v1, v2) {
  const parse = v => {
    const [version, prerelease] = v.split('-');
    const [major, minor, patch] = version.split('.').map(Number);
    return { major, minor, patch, prerelease };
  };
  
  const v1parts = parse(v1);
  const v2parts = parse(v2);
  
  if (v1parts.major !== v2parts.major) return v1parts.major - v2parts.major;
  if (v1parts.minor !== v2parts.minor) return v1parts.minor - v2parts.minor;
  if (v1parts.patch !== v2parts.patch) return v1parts.patch - v2parts.patch;
  
  // Handle pre-releases (e.g., -beta.1, -alpha.2)
  if (!v1parts.prerelease && v2parts.prerelease) return 1;
  if (v1parts.prerelease && !v2parts.prerelease) return -1;
  if (v1parts.prerelease === v2parts.prerelease) return 0;
  return v1parts.prerelease < v2parts.prerelease ? -1 : 1;
}

// Helper function to fetch remote version info from GitHub
async function getRemoteVersionInfo() {
  try {
    // Fetch package.json
    const pkgResponse = await fetch('https://api.github.com/repos/Paccoco/MoP-Inscription-Deck-Tracker/contents/package.json');
    if (!pkgResponse.ok) {
      throw new Error('Failed to fetch remote package.json');
    }
    const pkgData = await pkgResponse.json();
    const content = Buffer.from(pkgData.content, 'base64').toString('utf8');
    const remotePkg = JSON.parse(content);

    // Fetch latest release info
    const releaseResponse = await fetch('https://api.github.com/repos/Paccoco/MoP-Inscription-Deck-Tracker/releases/latest');
    const releaseInfo = releaseResponse.ok ? await releaseResponse.json() : null;

    return {
      version: remotePkg.version,
      releaseUrl: releaseInfo?.html_url || null,
      changelog: releaseInfo?.body || null,
      assets: releaseInfo?.assets || []
    };
  } catch (err) {
    console.error('Error fetching remote version:', err);
    return null;
  }
}

// Version endpoint (no auth required)
apiRouter.get('/version', async (req, res) => {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    const localVersion = pkg.version;
    const remoteInfo = await getRemoteVersionInfo();
    
    console.log('Local version:', localVersion);
    console.log('Remote version info:', remoteInfo);
    
    if (!remoteInfo) {
      return res.json({ 
        version: localVersion,
        remoteVersion: null,
        upToDate: null
      });
    }
    
    const versionCompare = compareVersions(localVersion, remoteInfo.version);
    
    res.json({ 
      version: localVersion,
      remoteVersion: remoteInfo.version,
      upToDate: versionCompare >= 0,
      updateAvailable: versionCompare < 0,
      isPrerelease: remoteInfo.version.includes('-'),
      releaseUrl: remoteInfo.releaseUrl,
      changelog: remoteInfo.changelog,
      updateAssets: remoteInfo.assets
    });
  } catch (err) {
    console.error('Error reading version:', err);
    res.status(500).json({ error: 'Could not read version.' });
  }
});

// Automatic update check (runs every 24 hours)
async function checkForUpdates() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    const localVersion = pkg.version;
    const remoteInfo = await getRemoteVersionInfo();
    
    // Log the check
    await db.run(
      'INSERT INTO update_checks (check_time, remote_version, local_version, update_available, error) VALUES (?, ?, ?, ?, ?)',
      [
        new Date().toISOString(),
        remoteInfo?.version || null,
        localVersion,
        remoteInfo && compareVersions(localVersion, remoteInfo.version) < 0 ? 1 : 0,
        null
      ]
    );

    if (remoteInfo && compareVersions(localVersion, remoteInfo.version) < 0) {
      // Notify admins of available update
      const admins = await db.all('SELECT username FROM users WHERE is_admin = 1');
      for (const admin of admins) {
        await db.run(
          'INSERT INTO notifications (username, message, created_at) VALUES (?, ?, ?)',
          [admin.username, `New version ${remoteInfo.version} is available for installation`, new Date().toISOString()]
        );
      }
    }
  } catch (err) {
    console.error('Update check failed:', err);
    await db.run(
      'INSERT INTO update_checks (check_time, remote_version, local_version, update_available, error) VALUES (?, ?, ?, ?, ?)',
      [new Date().toISOString(), null, null, 0, err.message]
    );
  }
}

// Schedule automatic update checks
setInterval(checkForUpdates, 24 * 60 * 60 * 1000); // Every 24 hours
setTimeout(checkForUpdates, 5000); // First check after 5 seconds

// Admin update endpoint
apiRouter.post('/admin/update', requireAdmin, async (req, res) => {
  try {
    const versionInfo = await getRemoteVersionInfo();
    if (!versionInfo) {
      return res.status(500).json({ error: 'Failed to fetch update information.' });
    }

    const updateId = (await db.run(
      'INSERT INTO system_updates (version, update_time, status, initiated_by) VALUES (?, ?, ?, ?)',
      [versionInfo.version, new Date().toISOString(), 'pending', req.user.username]
    )).lastID;

    // Create backup
    const backupDir = path.join(__dirname, 'backups', `${new Date().toISOString()}_${versionInfo.version}`);
    await new Promise((resolve, reject) => {
      fs.mkdir(backupDir, { recursive: true }, err => err ? reject(err) : resolve());
    });

    // Update backup path in database
    await db.run('UPDATE system_updates SET backup_path = ? WHERE id = ?', [backupDir, updateId]);

    // Notify admins and send Discord notification
    const admins = await db.all('SELECT username FROM users WHERE is_admin = 1');
    for (const admin of admins) {
      await db.run(
        'INSERT INTO notifications (username, message, created_at) VALUES (?, ?, ?)',
        [admin.username, `System update to version ${versionInfo.version} initiated by ${req.user.username}`, new Date().toISOString()]
      );
    }

    sendDiscordNotification(`[System Update] Updating to version ${versionInfo.version} initiated by ${req.user.username}`);

    res.json({ 
      success: true, 
      message: 'Update process initiated. The server will restart when complete.',
      version: versionInfo.version,
      updateId
    });

    // Execute update in background
    setTimeout(async () => {
      try {
        // Update status to in_progress
        await db.run('UPDATE system_updates SET status = ? WHERE id = ?', ['in_progress', updateId]);

        const updateScript = path.join(__dirname, 'scripts', 'update.sh');
        const updateProcess = require('child_process').spawn('bash', [updateScript, backupDir], {
          detached: true
        });

        let updateLog = '';
        updateProcess.stdout.on('data', (data) => {
          updateLog += data.toString();
          db.run('UPDATE system_updates SET log = ? WHERE id = ?', [updateLog, updateId]);
        });

        updateProcess.stderr.on('data', (data) => {
          updateLog += `[ERROR] ${data.toString()}`;
          db.run('UPDATE system_updates SET log = ? WHERE id = ?', [updateLog, updateId]);
        });

        updateProcess.on('close', async (code) => {
          if (code === 0) {
            await db.run('UPDATE system_updates SET status = ? WHERE id = ?', ['completed', updateId]);
            sendDiscordNotification(`[System Update] Successfully updated to version ${versionInfo.version}`);
          } else {
            await db.run(
              'UPDATE system_updates SET status = ?, error = ? WHERE id = ?',
              ['failed', `Update process exited with code ${code}`, updateId]
            );
            // Trigger rollback
            const rollbackScript = path.join(__dirname, 'scripts', 'rollback.sh');
            require('child_process').spawn('bash', [rollbackScript, backupDir], {
              detached: true
            });
          }
        });

      } catch (err) {
        await db.run(
          'UPDATE system_updates SET status = ?, error = ? WHERE id = ?',
          ['failed', err.message, updateId]
        );
        sendDiscordNotification(`[System Update] Failed to update to version ${versionInfo.version}: ${err.message}`);
      }
    }, 1000);

  } catch (err) {
    console.error('Update failed:', err);
    res.status(500).json({ error: 'Update failed: ' + err.message });
  }
});

// Admin rollback endpoint
apiRouter.post('/admin/rollback/:updateId', requireAdmin, async (req, res) => {
  try {
    const { updateId } = req.params;
    const update = await db.get('SELECT * FROM system_updates WHERE id = ?', [updateId]);
    
    if (!update) {
      return res.status(404).json({ error: 'Update not found' });
    }
    
    if (!update.backup_path) {
      return res.status(400).json({ error: 'No backup available for this update' });
    }

    // Log rollback attempt
    await db.run(
      'INSERT INTO activity_log (user_id, action, timestamp) VALUES (?, ?, ?)',
      [req.user.id, `Initiated rollback of update ${updateId} (version ${update.version})`, new Date().toISOString()]
    );

    // Update status
    await db.run('UPDATE system_updates SET status = ? WHERE id = ?', ['rolling_back', updateId]);

    // Notify admins
    const admins = await db.all('SELECT username FROM users WHERE is_admin = 1');
    for (const admin of admins) {
      await db.run(
        'INSERT INTO notifications (username, message, created_at) VALUES (?, ?, ?)',
        [admin.username, `System rollback to previous version initiated by ${req.user.username}`, new Date().toISOString()]
      );
    }

    res.json({ 
      success: true, 
      message: 'Rollback process initiated. The server will restart when complete.' 
    });

    // Execute rollback in background
    setTimeout(() => {
      const rollbackScript = path.join(__dirname, 'scripts', 'rollback.sh');
      require('child_process').spawn('bash', [rollbackScript, update.backup_path], {
        detached: true,
        stdio: 'ignore'
      }).unref();
    }, 1000);

  } catch (err) {
    console.error('Rollback failed:', err);
    res.status(500).json({ error: 'Rollback failed: ' + err.message });
  }
});

// Get update status endpoint
apiRouter.get('/admin/update/status/:updateId?', requireAdmin, async (req, res) => {
  try {
    const { updateId } = req.params;
    if (updateId) {
      // Get specific update status
      const update = await db.get('SELECT * FROM system_updates WHERE id = ?', [updateId]);
      if (!update) {
        return res.status(404).json({ error: 'Update not found' });
      }
      res.json(update);
    } else {
      // Get latest update status
      const update = await db.get('SELECT * FROM system_updates ORDER BY id DESC LIMIT 1');
      res.json(update || { status: 'no_updates' });
    }
  } catch (err) {
    console.error('Failed to fetch update status:', err);
    res.status(500).json({ error: 'Failed to fetch update status' });
  }
});

// Get update history endpoint
apiRouter.get('/admin/update/history', requireAdmin, async (req, res) => {
  try {
    const updates = await db.all(`
      SELECT 
        su.*,
        (SELECT COUNT(*) FROM update_checks 
         WHERE check_time > su.update_time 
         AND check_time < COALESCE(
           (SELECT update_time FROM system_updates 
            WHERE id > su.id ORDER BY id ASC LIMIT 1),
           datetime('now')
         )
        ) as check_count
      FROM system_updates su
      ORDER BY update_time DESC
    `);

    // Get check history for each update
    for (let update of updates) {
      update.checks = await db.all(
        'SELECT * FROM update_checks WHERE check_time > ? AND check_time < ? ORDER BY check_time DESC',
        [
          update.update_time,
          updates[updates.indexOf(update) - 1]?.update_time || new Date().toISOString()
        ]
      );
    }

    res.json(updates);
  } catch (err) {
    console.error('Failed to fetch update history:', err);
    res.status(500).json({ error: 'Failed to fetch update history' });
  }
});

// Manual version check endpoint
apiRouter.post('/admin/version-check', auth, requireAdmin, async (req, res) => {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    const localVersion = pkg.version;
    const remoteInfo = await getRemoteVersionInfo();
    
    // Log the manual check
    await db.run(
      'INSERT INTO update_checks (check_time, remote_version, local_version, update_available, error) VALUES (?, ?, ?, ?, ?)',
      [
        new Date().toISOString(),
        remoteInfo?.version || null,
        localVersion,
        remoteInfo && compareVersions(localVersion, remoteInfo.version) < 0 ? 1 : 0,
        null
      ]
    );

    const updateAvailable = remoteInfo && compareVersions(localVersion, remoteInfo.version) < 0;
    
    if (updateAvailable) {
      // Notify admins of available update
      const admins = await db.all('SELECT username FROM users WHERE is_admin = 1');
      for (const admin of admins) {
        await db.run(
          'INSERT INTO notifications (username, message, created_at) VALUES (?, ?, ?)',
          [admin.username, `Manual version check: New version ${remoteInfo.version} is available for installation`, new Date().toISOString()]
        );
      }
    }

    // Log the manual check activity
    logActivity(req.user.username, `Manual version check performed - ${updateAvailable ? `Update available: ${remoteInfo.version}` : 'Up to date'}`);

    res.json({
      success: true,
      localVersion,
      remoteVersion: remoteInfo?.version || null,
      updateAvailable,
      releaseNotes: remoteInfo?.body || null,
      publishedAt: remoteInfo?.published_at || null,
      message: updateAvailable 
        ? `Update available: ${remoteInfo.version}` 
        : 'Your installation is up to date'
    });

  } catch (err) {
    console.error('Manual version check failed:', err);
    
    // Log the failed check
    await db.run(
      'INSERT INTO update_checks (check_time, remote_version, local_version, update_available, error) VALUES (?, ?, ?, ?, ?)',
      [new Date().toISOString(), null, null, 0, err.message]
    );

    logActivity(req.user.username, `Manual version check failed: ${err.message}`);

    res.status(500).json({ 
      success: false,
      error: 'Failed to check for updates',
      details: err.message 
    });
  }
});

// Mount API router before static files
app.use('/api', apiRouter);

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
  try {
    db.all(`
      SELECT r.*, IFNULL(c.count,0) as contribution
      FROM deck_requests r
      LEFT JOIN (
        SELECT owner, COUNT(*) as count FROM cards GROUP BY owner
      ) c ON r.username = c.owner
      ORDER BY r.fulfilled ASC, contribution DESC, r.requested_at ASC
    `, [], (err, rows) => {
      if (err) {
        console.error('Error fetching deck requests:', err);
        return res.status(500).json({ error: 'Failed to fetch deck requests.' });
      }
      res.json(rows || []);
    });
  } catch (err) {
    console.error('Unexpected error in deck requests:', err);
    return res.status(500).json({ error: 'Internal server error while fetching deck requests.' });
  }
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

// Schedule an update
apiRouter.post('/admin/update/schedule', requireAdmin, async (req, res) => {
  try {
    const { scheduledTime, version } = req.body;
    
    if (!scheduledTime || !version) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate scheduled time is in the future
    const scheduleDate = new Date(scheduledTime);
    if (scheduleDate <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    // Create scheduled update
    const result = await db.run(
      'INSERT INTO scheduled_updates (version, scheduled_time, created_by, created_at, status) VALUES (?, ?, ?, ?, ?)',
      [version, scheduledTime, req.user.username, new Date().toISOString(), 'pending']
    );

    // Schedule the update
    const delay = scheduleDate.getTime() - Date.now();
    setTimeout(async () => {
      try {
        await executeScheduledUpdate(result.lastID);
      } catch (err) {
        console.error('Failed to execute scheduled update:', err);
      }
    }, delay);

    // Notify admins
    const admins = await db.all('SELECT username FROM users WHERE is_admin = 1');
    for (const admin of admins) {
      await db.run(
        'INSERT INTO notifications (username, message, created_at) VALUES (?, ?, ?)',
        [
          admin.username,
          `System update to version ${version} scheduled for ${new Date(scheduledTime).toLocaleString()} by ${req.user.username}`,
          new Date().toISOString()
        ]
      );
    }

    res.json({
      success: true,
      id: result.lastID,
      message: `Update scheduled for ${new Date(scheduledTime).toLocaleString()}`
    });
  } catch (err) {
    console.error('Failed to schedule update:', err);
    res.status(500).json({ error: 'Failed to schedule update' });
  }
});

// Get scheduled updates
apiRouter.get('/admin/update/scheduled', requireAdmin, async (req, res) => {
  try {
    const updates = await db.all(
      'SELECT * FROM scheduled_updates WHERE status = ? ORDER BY scheduled_time ASC',
      ['pending']
    );
    res.json(updates);
  } catch (err) {
    console.error('Failed to fetch scheduled updates:', err);
    res.status(500).json({ error: 'Failed to fetch scheduled updates' });
  }
});

// Cancel scheduled update
apiRouter.delete('/admin/update/scheduled/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the scheduled update
    const update = await db.get('SELECT * FROM scheduled_updates WHERE id = ?', [id]);
    if (!update) {
      return res.status(404).json({ error: 'Scheduled update not found' });
    }
    
    if (update.status !== 'pending') {
      return res.status(400).json({ error: 'Can only cancel pending updates' });
    }

    // Update status
    await db.run(
      'UPDATE scheduled_updates SET status = ?, completed_at = ? WHERE id = ?',
      ['cancelled', new Date().toISOString(), id]
    );

    // Notify admins
    const admins = await db.all('SELECT username FROM users WHERE is_admin = 1');
    for (const admin of admins) {
      await db.run(
        'INSERT INTO notifications (username, message, created_at) VALUES (?, ?, ?)',
        [
          admin.username,
          `Scheduled update to version ${update.version} cancelled by ${req.user.username}`,
          new Date().toISOString()
        ]
      );
    }

    res.json({ success: true, message: 'Update cancelled successfully' });
  } catch (err) {
    console.error('Failed to cancel scheduled update:', err);
    res.status(500).json({ error: 'Failed to cancel scheduled update' });
  }
});

// Helper function to execute scheduled update
async function executeScheduledUpdate(scheduleId) {
  try {
    const schedule = await db.get('SELECT * FROM scheduled_updates WHERE id = ?', [scheduleId]);
    if (!schedule || schedule.status !== 'pending') {
      return;
    }

    // Create system update
    const updateId = (await db.run(
      'INSERT INTO system_updates (version, update_time, status, initiated_by) VALUES (?, ?, ?, ?)',
      [schedule.version, new Date().toISOString(), 'pending', `Scheduled by ${schedule.created_by}`]
    )).lastID;

    // Create backup directory
    const backupDir = path.join(__dirname, 'backups', `${new Date().toISOString()}_${schedule.version}`);
    await new Promise((resolve, reject) => {
      fs.mkdir(backupDir, { recursive: true }, err => err ? reject(err) : resolve());
    });

    // Update backup path
    await db.run('UPDATE system_updates SET backup_path = ? WHERE id = ?', [backupDir, updateId]);

    // Execute update script
    const updateScript = path.join(__dirname, 'scripts', 'update.sh');
    const updateProcess = require('child_process').spawn('bash', [updateScript, backupDir], {
      detached: true
    });

    let updateLog = '';
    updateProcess.stdout.on('data', (data) => {
      updateLog += data.toString();
      db.run('UPDATE system_updates SET log = ? WHERE id = ?', [updateLog, updateId]);
    });

    updateProcess.stderr.on('data', (data) => {
      updateLog += `[ERROR] ${data.toString()}`;
      db.run('UPDATE system_updates SET log = ? WHERE id = ?', [updateLog, updateId]);
    });

    updateProcess.on('close', async (code) => {
      const now = new Date().toISOString();
      if (code === 0) {
        await db.run('UPDATE system_updates SET status = ? WHERE id = ?', ['completed', updateId]);
        await db.run(
          'UPDATE scheduled_updates SET status = ?, completed_at = ? WHERE id = ?',
          ['completed', now, scheduleId]
        );
      } else {
        const error = `Update process exited with code ${code}`;
        await db.run(
          'UPDATE system_updates SET status = ?, error = ? WHERE id = ?',
          ['failed', error, updateId]
        );
        await db.run(
          'UPDATE scheduled_updates SET status = ?, completed_at = ?, error = ? WHERE id = ?',
          ['failed', now, error, scheduleId]
        );
      }
    });

  } catch (err) {
    console.error('Failed to execute scheduled update:', err);
    await db.run(
      'UPDATE scheduled_updates SET status = ?, completed_at = ?, error = ? WHERE id = ?',
      ['failed', new Date().toISOString(), err.message, scheduleId]
    );
  }
}
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Serve static files from React build directory - MUST be after all API routes
app.use(express.static(path.join(__dirname, 'client', 'build')));

// Catch all other routes and serve React app - MUST be last route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});
