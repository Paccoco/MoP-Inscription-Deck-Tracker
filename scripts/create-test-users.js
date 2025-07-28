const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('../cards.db');

// Hash passwords
const adminHash = bcrypt.hashSync('testadmin123', 10);
const userHash = bcrypt.hashSync('testuser123', 10);

console.log('Creating test users...');

// Create test admin user
db.run(`INSERT OR REPLACE INTO users (id, username, password, is_admin, approved) VALUES (?, ?, ?, ?, ?)`, 
  [999, 'testadmin', adminHash, 1, 1], function(err) {
    if (err) console.log('Admin creation error:', err);
    else console.log('✅ Test admin created: username=testadmin, password=testadmin123');
});

// Create test regular user  
db.run(`INSERT OR REPLACE INTO users (id, username, password, is_admin, approved) VALUES (?, ?, ?, ?, ?)`, 
  [998, 'testuser', userHash, 0, 1], function(err) {
    if (err) console.log('User creation error:', err);
    else console.log('✅ Test user created: username=testuser, password=testuser123');
    
    // Check if users were created successfully
    db.all('SELECT id, username, is_admin, approved FROM users WHERE id IN (999, 998)', [], (err, rows) => {
      if (err) console.log('Query error:', err);
      else {
        console.log('\n📋 Created test users:');
        rows.forEach(row => {
          console.log(`  ${row.username}: ${row.is_admin ? 'Admin' : 'User'}, Approved: ${row.approved ? 'Yes' : 'No'}`);
        });
      }
      db.close();
    });
});
