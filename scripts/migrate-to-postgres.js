#!/usr/bin/env node
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

// PostgreSQL connection
const pgPool = new Pool({
  user: process.env.DB_USER || 'mop_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mop_card_tracker',
  password: process.env.DB_PASSWORD || 'mop_password',
  port: process.env.DB_PORT || 5432,
});

// SQLite connection
const sqliteDbPath = path.join(__dirname, '../cards.db');
const sqliteDb = new sqlite3.Database(sqliteDbPath);

// Migration utilities
const util = require('util');
const sqliteGet = util.promisify(sqliteDb.get.bind(sqliteDb));
const sqliteAll = util.promisify(sqliteDb.all.bind(sqliteDb));

async function migrateTables() {
  console.log('🔄 Starting migration from SQLite to PostgreSQL...');
  
  try {
    // Test PostgreSQL connection
    const pgClient = await pgPool.connect();
    console.log('✅ Connected to PostgreSQL');
    pgClient.release();

    // 1. Migrate Users
    console.log('📦 Migrating users...');
    const users = await sqliteAll('SELECT * FROM users');
    for (const user of users) {
      const userMapping = {
        username: user.username,
        password_hash: user.password,
        role: user.is_admin ? 'admin' : 'user',
        approved: Boolean(user.approved),
        created_at: user.created_at || new Date().toISOString(),
      };
      
      await pgPool.query(`
        INSERT INTO users (username, password_hash, role, approved, created_at) 
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (username) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          approved = EXCLUDED.approved
      `, [userMapping.username, userMapping.password_hash, userMapping.role, userMapping.approved, userMapping.created_at]);
    }
    console.log(`✅ Migrated ${users.length} users`);

    // 2. Migrate Cards
    console.log('📦 Migrating cards...');
    const cards = await sqliteAll(`
      SELECT c.*, u.username 
      FROM cards c 
      JOIN users u ON c.owner = u.username
    `);
    
    for (const card of cards) {
      // Get user UUID from PostgreSQL
      const userResult = await pgPool.query('SELECT id FROM users WHERE username = $1', [card.username]);
      if (userResult.rows.length === 0) {
        console.warn(`⚠️ User ${card.username} not found, skipping card ${card.card_name}`);
        continue;
      }
      
      const userId = userResult.rows[0].id;
      await pgPool.query(`
        INSERT INTO cards (user_id, card_name, created_at) 
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, card_name) DO NOTHING
      `, [userId, card.card_name, card.created_at || new Date().toISOString()]);
    }
    console.log(`✅ Migrated ${cards.length} cards`);

    // 3. Migrate Completed Decks
    console.log('📦 Migrating completed decks...');
    try {
      const decks = await sqliteAll('SELECT * FROM completed_decks');
      for (const deck of decks) {
        let contributors = [];
        try {
          contributors = JSON.parse(deck.contributors || '[]');
        } catch (e) {
          contributors = typeof deck.contributors === 'string' ? [deck.contributors] : [];
        }
        
        await pgPool.query(`
          INSERT INTO completed_decks (deck_name, contributors, completed_at, status, recipient) 
          VALUES ($1, $2, $3, $4, $5)
        `, [
          deck.deck,
          JSON.stringify(contributors),
          deck.completed_at || new Date().toISOString(),
          deck.disposition || 'completed',
          deck.recipient || null
        ]);
      }
      console.log(`✅ Migrated ${decks.length} completed decks`);
    } catch (err) {
      console.log('⚠️ No completed_decks table found or migration failed:', err.message);
    }

    // 4. Migrate Notifications
    console.log('📦 Migrating notifications...');
    try {
      const notifications = await sqliteAll('SELECT * FROM notifications');
      for (const notification of notifications) {
        // Get user UUID
        const userResult = await pgPool.query('SELECT id FROM users WHERE username = $1', [notification.username]);
        if (userResult.rows.length === 0 && notification.username !== 'system') {
          console.warn(`⚠️ User ${notification.username} not found, skipping notification`);
          continue;
        }
        
        const userId = notification.username === 'system' ? null : userResult.rows[0].id;
        await pgPool.query(`
          INSERT INTO notifications (user_id, message, type, is_read, created_at) 
          VALUES ($1, $2, $3, $4, $5)
        `, [
          userId,
          notification.message,
          'system', // Default type
          Boolean(notification.read),
          notification.created_at || new Date().toISOString()
        ]);
      }
      console.log(`✅ Migrated ${notifications.length} notifications`);
    } catch (err) {
      console.log('⚠️ No notifications table found or migration failed:', err.message);
    }

    // 5. Migrate Discord Webhook Configuration
    console.log('📦 Migrating Discord webhook...');
    try {
      const webhook = await sqliteGet('SELECT * FROM discord_webhook WHERE id = 1');
      if (webhook && webhook.url) {
        await pgPool.query(`
          INSERT INTO system_config (key, value, created_at) 
          VALUES ($1, $2, NOW())
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `, ['discord_webhook_url', webhook.url]);
        console.log('✅ Migrated Discord webhook configuration');
      }
    } catch (err) {
      console.log('⚠️ No Discord webhook found or migration failed:', err.message);
    }

    // 6. Migrate Gotify Configuration
    console.log('📦 Migrating Gotify configurations...');
    try {
      const gotifyConfigs = await sqliteAll('SELECT * FROM gotify_config');
      for (const config of gotifyConfigs) {
        const userResult = await pgPool.query('SELECT id FROM users WHERE username = $1', [config.username]);
        if (userResult.rows.length === 0) {
          console.warn(`⚠️ User ${config.username} not found, skipping Gotify config`);
          continue;
        }
        
        const userId = userResult.rows[0].id;
        await pgPool.query(`
          INSERT INTO user_notifications (user_id, gotify_server, gotify_token, created_at) 
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (user_id) DO UPDATE SET 
            gotify_server = EXCLUDED.gotify_server,
            gotify_token = EXCLUDED.gotify_token,
            updated_at = NOW()
        `, [userId, config.server, config.token]);
      }
      console.log(`✅ Migrated ${gotifyConfigs.length} Gotify configurations`);
    } catch (err) {
      console.log('⚠️ No Gotify configurations found or migration failed:', err.message);
    }

    console.log('🎉 Migration completed successfully!');
    
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    // Close connections
    sqliteDb.close();
    await pgPool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateTables()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Migration script failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateTables };
