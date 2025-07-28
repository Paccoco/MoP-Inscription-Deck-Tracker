require('dotenv').config();
const log = require('./logger');

// Choose database implementation based on environment
const dbType = process.env.DB_TYPE || 'sqlite';

if (dbType === 'postgresql') {
  log.database('Using PostgreSQL database');
  module.exports = require('./database-postgres');
} else {
  log.database('Using SQLite database');
  module.exports = require('./database');
}
