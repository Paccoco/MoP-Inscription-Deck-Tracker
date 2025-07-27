const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('cards.db');

db.run('UPDATE users SET approved = 1, is_admin = 1 WHERE username = ?', ['Paccoco'], function(err) {
  if (err) console.error('Error updating admin status:', err);
  else console.log('Admin user approved and admin status set');
  db.close();
});
