const { db } = require('./database-adapter');
const log = require('./logger');

// Log user activity to database
function logActivity(username, action) {
  db.run(
    'INSERT INTO activity (username, action, timestamp) VALUES (?, ?, ?)',
    [username, action, new Date().toISOString()],
    function (err) {
      if (err) {
        log.error('Activity log error', err);
      }
    }
  );
}

module.exports = {
  logActivity
};
