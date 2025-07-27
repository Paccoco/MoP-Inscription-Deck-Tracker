const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'cards.db');

console.log('🏭 Production Database Initialization');
console.log('=====================================');

// Safety check for production
if (process.env.NODE_ENV !== 'production') {
  console.log('⚠️  WARNING: This script is designed for production environments.');
  console.log('   For development, use: node init-database.js');
  process.exit(1);
}

function initializeProductionDatabase() {
  const db = new sqlite3.Database(dbPath);
  console.log('Creating required database tables for production...');

  db.serialize(() => {
    // Create users table
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
        console.log('✅ Users table ready');
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
        console.log('✅ Cards table ready');
      }
    });

    // Create decks table
    db.run(`CREATE TABLE IF NOT EXISTS decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_name TEXT NOT NULL,
      total_cards INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0
    )`, (err) => {
      if (err) {
        console.error('Error creating decks table:', err);
      } else {
        console.log('✅ Decks table ready');
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
        console.log('✅ Discord webhook table ready');
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
        console.log('✅ Update checks table ready');
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
        console.log('✅ Notifications table ready');
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
        console.log('✅ System updates table ready');
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
        console.log('✅ Activity log table ready');
      }
    });

    // Check existing data
    setTimeout(() => {
      db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (!err && row) {
          console.log(`\n📊 Current database status:`);
          console.log(`   - Users: ${row.count}`);
        }
        
        db.get('SELECT COUNT(*) as count FROM cards', (err, row) => {
          if (!err && row) {
            console.log(`   - Cards: ${row.count}`);
          }
          
          console.log('\n🎉 Production database initialization complete!');
          console.log('   All required tables are ready for the application.');
          db.close();
        });
      });
    }, 1000);
  });
}

// Check if database already exists
const fs = require('fs');
if (fs.existsSync(dbPath)) {
  console.log('📂 Existing database detected - ensuring all tables exist...');
} else {
  console.log('🆕 Creating new production database...');
}

initializeProductionDatabase();
