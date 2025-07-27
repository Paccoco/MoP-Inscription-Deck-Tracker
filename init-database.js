const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

const dbPath = path.join(__dirname, 'cards.db');

// Safety check: Warn if database already exists with data
if (fs.existsSync(dbPath)) {
  console.log('⚠️  WARNING: Database file already exists!');
  
  // Check if database has data
  const db = new sqlite3.Database(dbPath);
  db.get('SELECT COUNT(*) as count FROM users WHERE 1', (err, row) => {
    if (!err && row && row.count > 0) {
      console.log('🚨 CRITICAL WARNING: Database contains existing users!');
      console.log('   This script should NOT be run on production servers with existing data.');
      console.log('   Production data will be preserved, but test users may be added.');
      console.log('   Press Ctrl+C within 10 seconds to cancel...');
      
      setTimeout(() => {
        console.log('⏳ Continuing with database initialization...');
        initializeDatabase();
      }, 10000);
      return;
    } else {
      console.log('📂 Empty database detected, proceeding with initialization...');
      initializeDatabase();
    }
  });
} else {
  console.log('🆕 Creating new database...');
  initializeDatabase();
}

function initializeDatabase() {
  const db = new sqlite3.Database(dbPath);
  console.log('Creating database tables...');

db.serialize(() => {
  // Create users table based on the usage in server-auth.js
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    approved INTEGER DEFAULT 0
  )`, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('Users table created successfully');
    }
  });

  // Create cards table 
  db.run(`CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_name TEXT NOT NULL,
    owner TEXT NOT NULL,
    deck TEXT NOT NULL
  )`, (err) => {
    if (err) {
      console.error('Error creating cards table:', err);
    } else {
      console.log('Cards table created successfully');
    }
  });

  // Create other tables that might be needed
  db.run(`CREATE TABLE IF NOT EXISTS decks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_name TEXT NOT NULL,
    total_cards INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0
  )`, (err) => {
    if (err) {
      console.error('Error creating decks table:', err);
    } else {
      console.log('Decks table created successfully');
    }
  });

  // Create discord_webhook table
  db.run(`CREATE TABLE IF NOT EXISTS discord_webhook (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    url TEXT
  )`, (err) => {
    if (err) {
      console.error('Error creating discord_webhook table:', err);
    } else {
      console.log('Discord webhook table created successfully');
    }
  });

  // Create update_checks table
  db.run(`CREATE TABLE IF NOT EXISTS update_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    check_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    remote_version TEXT,
    local_version TEXT,
    update_available INTEGER DEFAULT 0,
    error TEXT
  )`, (err) => {
    if (err) {
      console.error('Error creating update_checks table:', err);
    } else {
      console.log('Update checks table created successfully');
    }
  });

  // Create notifications table
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read INTEGER DEFAULT 0
  )`, (err) => {
    if (err) {
      console.error('Error creating notifications table:', err);
    } else {
      console.log('Notifications table created successfully');
    }
  });

  // Create system_updates table
  db.run(`CREATE TABLE IF NOT EXISTS system_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'in_progress',
    initiated_by TEXT
  )`, (err) => {
    if (err) {
      console.error('Error creating system_updates table:', err);
    } else {
      console.log('System updates table created successfully');
    }
  });

  // Create activity_log table
  db.run(`CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`, (err) => {
    if (err) {
      console.error('Error creating activity_log table:', err);
    } else {
      console.log('Activity log table created successfully');
    }
  });

  // Only create test users if NODE_ENV is not production
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧪 Creating test users for development/testing...');
    
    // Now create test users
    bcrypt.hash('testadmin123', 10, (err, adminHash) => {
      if (err) {
        console.error('Error hashing admin password:', err);
        return;
      }
      
      db.run('INSERT OR REPLACE INTO users (id, username, password, is_admin, approved) VALUES (?, ?, ?, ?, ?)',
        [999, 'testadmin', adminHash, 1, 1], (err) => {
          if (err) {
            console.error('Admin creation error:', err);
          } else {
            console.log('Test admin user created: testadmin/testadmin123');
          }
        });
    });

    bcrypt.hash('testuser123', 10, (err, userHash) => {
      if (err) {
        console.error('Error hashing user password:', err);
        return;
      }
      
      db.run('INSERT OR REPLACE INTO users (id, username, password, is_admin, approved) VALUES (?, ?, ?, ?, ?)',
        [998, 'testuser', userHash, 0, 1], (err) => {
          if (err) {
            console.error('User creation error:', err);
          } else {
            console.log('Test regular user created: testuser/testuser123');
          }
        });
    });

    // Verify users were created
    setTimeout(() => {
      db.all('SELECT id, username, is_admin, approved FROM users WHERE id IN (999, 998)', [], (err, rows) => {
        if (err) {
          console.error('Query error:', err);
        } else {
          console.log('Created test users:', rows);
        }
        db.close();
      });
    }, 1000);
  } else {
    console.log('🏭 Production environment detected - skipping test user creation');
    setTimeout(() => {
      db.close();
    }, 1000);
  }
  });
}
