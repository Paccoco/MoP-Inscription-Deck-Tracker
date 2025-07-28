require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const log = require('./logger');

// PostgreSQL connection configuration
const poolConfig = {
  user: process.env.DB_USER || 'mop_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mop_card_tracker',
  password: process.env.DB_PASSWORD || 'mop_password',
  port: process.env.DB_PORT || 5432,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
};

// Create connection pool
const pool = new Pool(poolConfig);

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    log.database('Connected to PostgreSQL database successfully');
    client.release();
    return true;
  } catch (err) {
    log.error('Failed to connect to PostgreSQL database', err);
    return false;
  }
}

// Initialize database schema
async function initializeDatabase() {
  try {
    log.database('Initializing PostgreSQL database schema...');
    
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Unable to connect to PostgreSQL database');
    }

    // Check if database is already initialized
    try {
      const result = await pool.query("SELECT to_regclass('users') as exists");
      if (result.rows[0].exists) {
        log.database('Database schema already exists, skipping initialization');
        return pool;
      }
    } catch (err) {
      // If query fails, database likely needs initialization
      log.database('Database schema check failed, proceeding with initialization...');
    }

    // Read and execute schema file
    const schemaPath = path.join(__dirname, '../../postgresql-schema.sql');
    if (fs.existsSync(schemaPath)) {
      try {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schema);
        log.database('Database schema initialized successfully');
      } catch (err) {
        // Handle "already exists" errors gracefully
        if (err.code === '42710' || err.code === '42P07') {
          log.database('Database schema components already exist, continuing...');
        } else {
          throw err;
        }
      }
    } else {
      log.warn('PostgreSQL schema file not found, skipping schema initialization');
    }

    return pool;
  } catch (err) {
    log.error('Failed to initialize PostgreSQL database', err);
    throw err;
  }
}

// Ensure admin user exists
async function ensureAdminExists() {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminUsername || !adminPassword) {
    log.warn('Admin credentials not found in environment variables');
    return;
  }

  try {
    // Check if admin user exists
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [adminUsername]);
    
    const hash = await bcrypt.hash(adminPassword, 10);
    
    if (result.rows.length > 0) {
      // Update existing admin user
      await pool.query(
        'UPDATE users SET password_hash = $1, role = $2, approved = $3, updated_at = NOW() WHERE username = $4',
        [hash, 'admin', true, adminUsername]
      );
      log.admin(adminUsername, 'Admin user updated successfully');
    } else {
      // Create new admin user
      await pool.query(
        'INSERT INTO users (username, password_hash, role, approved, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [adminUsername, hash, 'admin', true]
      );
      log.admin(adminUsername, 'Admin user created successfully');
    }
  } catch (err) {
    log.error('Error ensuring admin user exists', err);
  }
}

// Graceful shutdown
async function closeDatabase() {
  try {
    await pool.end();
    log.database('PostgreSQL connection pool closed');
  } catch (err) {
    log.error('Error closing PostgreSQL connection pool', err);
  }
}

// Export the pool instance and utility functions
module.exports = {
  db: pool,
  query: async (text, params) => {
    const result = await pool.query(text, params);
    return result.rows; // Return just the rows array for consistency with SQLite
  },
  close: () => pool.end(), // Add close method for consistency
  initializeDatabase,
  ensureAdminExists,
  testConnection,
  closeDatabase
};
