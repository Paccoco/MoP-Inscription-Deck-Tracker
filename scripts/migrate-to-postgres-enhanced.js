#!/usr/bin/env node
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Get command line arguments
const args = process.argv.slice(2);
const sourceDbArg = args.find(arg => arg.startsWith('--source='));
const sourceDb = sourceDbArg ? sourceDbArg.split('=')[1] : 'cards.db';

// Available databases
const availableDatabases = {
  'cards.db': '../cards.db',
  'cards.old.db': './cards.old.db', 
  'client': '../client/cards.db'
};

// Validate source database
if (!availableDatabases[sourceDb] && !fs.existsSync(sourceDb)) {
  console.error('❌ Invalid source database. Available options:');
  Object.keys(availableDatabases).forEach(db => {
    const dbPath = availableDatabases[db];
    const exists = fs.existsSync(dbPath);
    console.log(`  - ${db} (${dbPath}) ${exists ? '✅' : '❌ not found'}`);
  });
  console.log('\nUsage: node migrate-to-postgres-enhanced.js --source=cards.db');
  process.exit(1);
}

// Resolve database path
const sqliteDbPath = availableDatabases[sourceDb] || sourceDb;
console.log(`🔄 Using source database: ${sqliteDbPath}`);

// PostgreSQL connection
const pgPool = new Pool({
  user: process.env.DB_USER || 'mop_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mop_card_tracker',
  password: process.env.DB_PASSWORD || 'mop_password',
  port: process.env.DB_PORT || 5432,
});

// SQLite connection
const sqliteDb = new sqlite3.Database(sqliteDbPath);

// Migration utilities
const util = require('util');
const sqliteGet = util.promisify(sqliteDb.get.bind(sqliteDb));
const sqliteAll = util.promisify(sqliteDb.all.bind(sqliteDb));

// Function to check if table exists in SQLite
async function tableExists(tableName) {
  try {
    const result = await sqliteGet(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?", 
      [tableName]
    );
    return !!result;
  } catch (err) {
    return false;
  }
}

// Function to analyze source database
async function analyzeDatabase() {
  console.log('🔍 Analyzing source database...');
  
  try {
    // Get all tables
    const tables = await sqliteAll("SELECT name FROM sqlite_master WHERE type='table'");
    console.log(`📊 Found ${tables.length} tables: ${tables.map(t => t.name).join(', ')}`);
    
    // Count rows in main tables
    const mainTables = ['users', 'cards', 'completed_decks', 'notifications', 'announcements'];
    for (const table of mainTables) {
      if (await tableExists(table)) {
        const count = await sqliteGet(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   - ${table}: ${count.count} rows`);
      }
    }
    
    return tables.map(t => t.name);
  } catch (err) {
    console.error('❌ Error analyzing database:', err);
    throw err;
  }
}

// Migration functions for each table
async function migrateUsers(uuidMap) {
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
    
    const result = await pgPool.query(`
      INSERT INTO users (username, password_hash, role, approved, created_at) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        approved = EXCLUDED.approved
      RETURNING id
    `, [userMapping.username, userMapping.password_hash, userMapping.role, userMapping.approved, userMapping.created_at]);
    
    // Store UUID mapping for foreign keys - map both by ID and username
    uuidMap.set(`user_${user.id}`, result.rows[0].id);
    uuidMap.set(`user_${user.username}`, result.rows[0].id); // Map by username for owner field
  }
  console.log(`✅ Migrated ${users.length} users`);
}

async function migrateCards(uuidMap) {
  if (!await tableExists('cards')) return;
  
  console.log('📦 Migrating cards...');
  const cards = await sqliteAll('SELECT * FROM cards');
  
  for (const card of cards) {
    const userId = uuidMap.get(`user_${card.owner}`); // Use owner field to get user UUID
    if (!userId) {
      console.warn(`⚠️  User not found for card owner: ${card.owner}`);
      continue;
    }
    
    await pgPool.query(`
      INSERT INTO cards (user_id, card_name, created_at) 
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, card_name) DO UPDATE SET
        card_name = EXCLUDED.card_name
    `, [
      userId,
      card.card_name,
      card.created_at || new Date().toISOString()
    ]);
  }
  console.log(`✅ Migrated ${cards.length} cards`);
}

async function migrateCompletedDecks(uuidMap) {
  if (!await tableExists('completed_decks')) return;
  
  console.log('📦 Migrating completed_decks...');
  const decks = await sqliteAll('SELECT * FROM completed_decks');
  
  for (const deck of decks) {
    // Parse the contributors JSON from SQLite
    let contributors;
    try {
      contributors = JSON.parse(deck.contributors);
    } catch (err) {
      console.warn(`⚠️  Invalid contributors JSON for deck: ${deck.deck}`);
      contributors = [];
    }
    
    await pgPool.query(`
      INSERT INTO completed_decks (deck_name, contributors, completed_at, disposition, recipient) 
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
}

async function migrateNotifications(uuidMap) {
  if (!await tableExists('notifications')) return;
  
  console.log('📦 Migrating notifications...');
  const notifications = await sqliteAll('SELECT * FROM notifications');
  
  for (const notification of notifications) {
    const userId = uuidMap.get(`user_${notification.username}`); // Use username to get user UUID
    if (!userId) {
      console.warn(`⚠️  User not found for notification username: ${notification.username}`);
      continue;
    }
    
    await pgPool.query(`
      INSERT INTO notifications (user_id, type, title, message, read, created_at) 
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      userId,
      'system', // Use 'system' type since SQLite doesn't have type field and 'info' is not valid
      'Migrated Notification', // Default title since SQLite doesn't have title field
      notification.message,
      Boolean(notification.read),
      notification.created_at || new Date().toISOString()
    ]);
  }
  console.log(`✅ Migrated ${notifications.length} notifications`);
}

async function migrateAnnouncements(uuidMap) {
  if (!await tableExists('announcements')) return;
  
  console.log('📦 Migrating announcements...');
  const announcements = await sqliteAll('SELECT * FROM announcements');
  
  for (const announcement of announcements) {
    await pgPool.query(`
      INSERT INTO announcements (title, content, priority, active, created_by, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      announcement.title,
      announcement.content,
      announcement.priority || 'normal',
      Boolean(announcement.active),
      uuidMap.get(`user_${announcement.created_by}`),
      announcement.created_at || new Date().toISOString(),
      announcement.updated_at || new Date().toISOString()
    ]);
  }
  console.log(`✅ Migrated ${announcements.length} announcements`);
}

async function migrateConfigs(uuidMap) {
  // Discord webhook configs
  if (await tableExists('discord_webhook_configs')) {
    console.log('📦 Migrating discord webhook configs...');
    const configs = await sqliteAll('SELECT * FROM discord_webhook_configs');
    
    for (const config of configs) {
      await pgPool.query(`
        INSERT INTO discord_webhook_configs (user_id, webhook_url, enabled, created_at) 
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id) DO UPDATE SET
          webhook_url = EXCLUDED.webhook_url,
          enabled = EXCLUDED.enabled
      `, [
        uuidMap.get(`user_${config.user_id}`),
        config.webhook_url,
        Boolean(config.enabled),
        config.created_at || new Date().toISOString()
      ]);
    }
    console.log(`✅ Migrated ${configs.length} discord configs`);
  }
  
  // Gotify configs
  if (await tableExists('gotify_configs')) {
    console.log('📦 Migrating gotify configs...');
    const configs = await sqliteAll('SELECT * FROM gotify_configs');
    
    for (const config of configs) {
      await pgPool.query(`
        INSERT INTO gotify_configs (user_id, server_url, app_token, enabled, created_at) 
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id) DO UPDATE SET
          server_url = EXCLUDED.server_url,
          app_token = EXCLUDED.app_token,
          enabled = EXCLUDED.enabled
      `, [
        uuidMap.get(`user_${config.user_id}`),
        config.server_url,
        config.app_token,
        Boolean(config.enabled),
        config.created_at || new Date().toISOString()
      ]);
    }
    console.log(`✅ Migrated ${configs.length} gotify configs`);
  }
}

async function migrateDeckRequests(uuidMap) {
  if (!await tableExists('deck_requests')) return;
  
  console.log('📦 Migrating deck requests...');
  const requests = await sqliteAll('SELECT * FROM deck_requests');
  
  for (const request of requests) {
    const userId = uuidMap.get(`user_${request.username}`); // Use username to get user UUID
    if (!userId) {
      console.warn(`⚠️  User not found for deck request username: ${request.username}`);
      continue;
    }
    
    await pgPool.query(`
      INSERT INTO deck_requests (user_id, deck_name, status, requested_at, fulfilled_at, notes) 
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      userId,
      request.deck,
      request.fulfilled ? 'completed' : 'pending',
      request.requested_at || new Date().toISOString(),
      request.fulfilled_at || null,
      request.trinket || null // Use trinket field as notes
    ]);
  }
  console.log(`✅ Migrated ${requests.length} deck requests`);
}

// Main migration function
async function migrateToPostgreSQL() {
  console.log('🚀 Starting SQLite to PostgreSQL migration...');
  console.log(`📁 Source: ${sqliteDbPath}`);
  
  try {
    // Analyze source database
    const sourceTables = await analyzeDatabase();
    
    // Test PostgreSQL connection
    await pgPool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connection successful');
    
    // UUID mapping for foreign key relationships
    const uuidMap = new Map();
    
    // Migrate users table first (needed for foreign keys)
    if (await tableExists('users')) {
      await migrateUsers(uuidMap);
    }
    
    // Migrate other tables based on what exists in source
    const migrationOrder = [
      'cards',
      'completed_decks', 
      'notifications',
      'announcements',
      'deck_requests'
    ];
    
    for (const table of migrationOrder) {
      if (await tableExists(table)) {
        console.log(`🔄 Processing ${table}...`);
        switch (table) {
          case 'cards':
            await migrateCards(uuidMap);
            break;
          case 'completed_decks':
            await migrateCompletedDecks(uuidMap);
            break;
          case 'notifications':
            await migrateNotifications(uuidMap);
            break;
          case 'announcements':
            await migrateAnnouncements(uuidMap);
            break;
          case 'deck_requests':
            await migrateDeckRequests(uuidMap);
            break;
        }
      } else {
        console.log(`⚠️  Table ${table} not found in source, skipping...`);
      }
    }
    
    // Migrate config tables
    await migrateConfigs(uuidMap);
    
    console.log('✅ Migration completed successfully!');
    console.log('\n📋 Migration Summary:');
    
    // Show final counts
    for (const table of ['users', ...migrationOrder]) {
      if (await tableExists(table)) {
        try {
          const pgResult = await pgPool.query(`SELECT COUNT(*) FROM ${table}`);
          console.log(`   - ${table}: ${pgResult.rows[0].count} rows migrated`);
        } catch (err) {
          console.log(`   - ${table}: ❌ error checking count`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    sqliteDb.close();
    await pgPool.end();
  }
}

// Run migration
if (require.main === module) {
  migrateToPostgreSQL()
    .then(() => {
      console.log('🎉 Migration process completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('💥 Migration process failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateToPostgreSQL, analyzeDatabase };
