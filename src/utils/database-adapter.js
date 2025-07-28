require('dotenv').config();

// Database adapter that switches between SQLite and PostgreSQL
const DB_TYPE = process.env.DB_TYPE || 'sqlite'; // 'sqlite' or 'postgresql'

let dbModule;

if (DB_TYPE === 'postgresql') {
  console.log('🐘 Using PostgreSQL database');
  dbModule = require('./database-postgres');
} else {
  console.log('🗄️ Using SQLite database');
  dbModule = require('./database');
}

// Export the appropriate database module
module.exports = dbModule;
