const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../cards.db');
const username = 'Paccoco';
const hash = '$2b$10$q93FWpMnqgXEC2ufKZeBpuFYbaBFeRyNjpmVO2/OHu/V8czlwyjSC';
db.run('UPDATE users SET password = ? WHERE username = ?', [hash, username], function(err) {
  if (err) console.error('Error updating password:', err);
  else console.log('Password updated for', username);
  db.close();
});
