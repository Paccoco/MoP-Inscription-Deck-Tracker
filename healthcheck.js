const { db } = require('./src/utils/database-adapter');
const log = require('./src/utils/logger');

// Simple health check for Docker
async function healthCheck() {
  try {
    // Check if we can connect to the database
    if (db) {
      // Simple database query to verify connection
      db.get('SELECT 1 as health', [], (err, row) => {
        if (err) {
          log.error('Health check failed - database error', { error: err.message });
          process.exit(1);
        }
        if (row && row.health === 1) {
          log.info('Health check passed');
          process.exit(0);
        } else {
          log.error('Health check failed - unexpected database response');
          process.exit(1);
        }
      });
    } else {
      log.error('Health check failed - database not initialized');
      process.exit(1);
    }
  } catch (error) {
    log.error('Health check failed - exception', { error: error.message });
    process.exit(1);
  }
}

healthCheck();
