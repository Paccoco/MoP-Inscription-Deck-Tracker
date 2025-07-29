/**
 * PostgreSQL Database Configuration and Connection Pool
 * MoP Inscription Deck Tracker v2.0+
 * 
 * Replaces SQLite with PostgreSQL for better scalability and performance
 */

const { Pool, Client } = require('pg');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const log = require('../src/utils/logger');

// Database configuration
const dbConfig = {
    user: process.env.DB_USER || 'mop_tracker_app',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mop_card_tracker',
    password: process.env.DB_PASSWORD || 'secure_password_123',
    port: parseInt(process.env.DB_PORT) || 5432,
    
    // Connection pool settings
    max: parseInt(process.env.DB_POOL_SIZE) || 20,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
    
    // SSL configuration for production
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false,
    
    // Application name for monitoring
    application_name: 'mop-card-tracker'
};

// Create connection pool
const pool = new Pool(dbConfig);

// Pool event handlers
pool.on('connect', (client) => {
    log.database('PostgreSQL client connected to database');
});

pool.on('error', (err, client) => {
    log.error('Unexpected error on idle PostgreSQL client', err);
    process.exit(1);
});

pool.on('acquire', (client) => {
    log.database('PostgreSQL client acquired from pool');
});

pool.on('release', (client) => {
    log.database('PostgreSQL client released back to pool');
});

/**
 * Initialize database with schema and default data
 */
async function initializeDatabase() {
    log.database('Initializing PostgreSQL database...');
    
    try {
        // Test connection
        const client = await pool.connect();
        log.database('PostgreSQL connection successful');
        
        // Check if tables exist
        const tableCheck = await client.query(`
            SELECT COUNT(*) as table_count 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'cards', 'completed_decks')
        `);
        
        const tableCount = parseInt(tableCheck.rows[0].table_count);
        
        if (tableCount === 0) {
            log.database('Creating database schema...');
            
            // Read and execute schema file
            const schemaPath = path.join(__dirname, 'postgresql-schema.sql');
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            
            await client.query(schemaSql);
            log.database('Database schema created successfully');
            
            // Create default admin user in development
            if (process.env.NODE_ENV !== 'production') {
                await createDefaultUsers(client);
            }
        } else {
            log.database('Database schema already exists');
        }
        
        client.release();
        log.database('Database initialization completed');
        
    } catch (error) {
        log.error('Database initialization failed', error);
        throw error;
    }
}

/**
 * Create default users for development
 */
async function createDefaultUsers(client) {
    log.database('Creating default development users...');
    
    const bcrypt = require('bcrypt');
    const saltRounds = 12;
    
    try {
        // Default admin user
        const adminPassword = await bcrypt.hash('testadmin123', saltRounds);
        await client.query(`
            INSERT INTO users (username, password_hash, email, role, approved)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (username) DO NOTHING
        `, ['testadmin', adminPassword, 'admin@test.com', 'admin', true]);
        
        // Default regular user
        const userPassword = await bcrypt.hash('testuser123', saltRounds);
        await client.query(`
            INSERT INTO users (username, password_hash, email, role, approved)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (username) DO NOTHING
        `, ['testuser', userPassword, 'user@test.com', 'user', true]);
        
        log.database('Default users created (testadmin/testadmin123, testuser/testuser123)');
        
    } catch (error) {
        log.error('Failed to create default users', error);
        // Don't throw - this is not critical
    }
}

/**
 * Test database connectivity
 */
async function testConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
        client.release();
        
        log.database('PostgreSQL connection test successful');
        log.info(`Server time: ${result.rows[0].current_time}`);
        log.info(`PostgreSQL version: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`);
        
        return true;
    } catch (error) {
        log.error('PostgreSQL connection test failed', error);
        return false;
    }
}

/**
 * Execute a query with connection pool
 */
async function query(text, params = []) {
    const start = Date.now();
    
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        
        // Log slow queries (>100ms)
        if (duration > 100) {
            console.warn(`🐌 Slow query detected (${duration}ms): ${text.substring(0, 100)}...`);
        }
        
        return result;
    } catch (error) {
        console.error('❌ Database query error:', {
            error: error.message,
            query: text.substring(0, 100) + '...',
            params: params
        });
        throw error;
    }
}

/**
 * Execute a transaction
 */
async function transaction(callback) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Get database statistics
 */
async function getStats() {
    try {
        const result = await query(`
            SELECT 
                schemaname,
                tablename,
                n_tup_ins as inserts,
                n_tup_upd as updates,
                n_tup_del as deletes,
                n_live_tup as live_rows,
                n_dead_tup as dead_rows
            FROM pg_stat_user_tables
            ORDER BY n_live_tup DESC
        `);
        
        return result.rows;
    } catch (error) {
        console.error('❌ Failed to get database stats:', error);
        return [];
    }
}

/**
 * Cleanup expired data
 */
async function cleanup() {
    try {
        log.database('Running database cleanup...');
        
        // Cleanup expired notifications
        const notificationResult = await query('SELECT cleanup_expired_notifications()');
        const deletedNotifications = notificationResult.rows[0].cleanup_expired_notifications;
        
        // Cleanup expired sessions
        const sessionResult = await query('SELECT cleanup_expired_sessions()');
        const deletedSessions = sessionResult.rows[0].cleanup_expired_sessions;
        
        log.database(`Cleanup completed: ${deletedNotifications} notifications, ${deletedSessions} sessions removed`);
        
        return {
            notifications: deletedNotifications,
            sessions: deletedSessions
        };
    } catch (error) {
        console.error('❌ Database cleanup failed:', error);
        throw error;
    }
}

/**
 * Graceful shutdown
 */
async function close() {
    log.database('Closing PostgreSQL connection pool...');
    await pool.end();
    log.database('PostgreSQL connection pool closed');
}

// Graceful shutdown handlers
process.on('SIGINT', close);
process.on('SIGTERM', close);
process.on('exit', close);

module.exports = {
    pool,
    query,
    transaction,
    initializeDatabase,
    testConnection,
    getStats,
    cleanup,
    close
};
