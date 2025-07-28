const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, '../cards.db');
const db = new sqlite3.Database(dbPath);

async function addAdminUser() {
  const username = 'admin';
  const password = 'admin123';
  
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (existingUser) {
      console.log(`User '${username}' already exists. Updating to admin and resetting password...`);
      
      // Update existing user to be admin and approved, reset password
      await new Promise((resolve, reject) => {
        db.run('UPDATE users SET password = ?, is_admin = 1, approved = 1 WHERE username = ?', 
          [hashedPassword, username], (err) => {
            if (err) reject(err);
            else resolve();
          });
      });
      
      console.log(`✅ Updated '${username}' to admin with password '${password}'`);
    } else {
      // Create new admin user (approved by default)
      await new Promise((resolve, reject) => {
        db.run('INSERT INTO users (username, password, is_admin, approved) VALUES (?, ?, 1, 1)', 
          [username, hashedPassword], (err) => {
            if (err) reject(err);
            else resolve();
          });
      });
      
      console.log(`✅ Created admin user '${username}' with password '${password}'`);
    }
    
    // Verify the user was created/updated
    const verifyUser = await new Promise((resolve, reject) => {
      db.get('SELECT username, is_admin, approved FROM users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    console.log(`📊 Verification - Username: ${verifyUser.username}, Admin: ${verifyUser.is_admin === 1 ? 'Yes' : 'No'}, Approved: ${verifyUser.approved === 1 ? 'Yes' : 'No'}`);
    console.log(`\n🚀 You can now log in at http://localhost:5000 with:`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    
  } catch (error) {
    console.error('❌ Error adding admin user:', error);
  } finally {
    db.close();
  }
}

addAdminUser();
