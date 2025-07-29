require('dotenv').config();
const log = require('./logger');

// Choose database implementation based on environment
// Default to PostgreSQL for both development and production
const dbType = process.env.DB_TYPE || 'postgresql';

if (dbType === 'postgresql') {
  log.database('Using PostgreSQL database');
  module.exports = require('./database-postgres');
} else if (dbType === 'sqlite') {
  log.database('Using SQLite database (legacy fallback)');
  module.exports = require('./database');
} else {
  log.error('Invalid DB_TYPE specified. Must be "postgresql" or "sqlite"');
  process.exit(1);
}
