require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// Initialize SQLite database
let db;
const dbPath = path.join(__dirname, '../../cards.db');

function initializeDatabase() {
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
  
  return db;
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

// Initialize and export database connection
if (!db) {
  db = initializeDatabase();
}

module.exports = {
  db,
  initializeDatabase,
  ensureAdminExists
};
