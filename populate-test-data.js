const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'cards.db');
const db = new sqlite3.Database(dbPath);

async function populateTestData() {
  console.log('🚀 Populating database with test data...');
  
  try {
    // First, ensure admin user exists
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Insert admin user if not exists
    await new Promise((resolve, reject) => {
      db.run(`INSERT OR REPLACE INTO users (username, password, is_admin, approved) VALUES (?, ?, 1, 1)`, 
        ['admin', hashedPassword], (err) => {
          if (err) reject(err);
          else resolve();
        });
    });
    
    // Create test users
    const testUsers = [
      { username: 'testuser1', password: 'password123', is_admin: 0, approved: 1 },
      { username: 'testuser2', password: 'password123', is_admin: 0, approved: 1 },
      { username: 'pendinguser', password: 'password123', is_admin: 0, approved: 0 }
    ];
    
    for (const user of testUsers) {
      const hashedPass = await bcrypt.hash(user.password, 10);
      await new Promise((resolve, reject) => {
        db.run(`INSERT OR REPLACE INTO users (username, password, is_admin, approved) VALUES (?, ?, ?, ?)`, 
          [user.username, hashedPass, user.is_admin, user.approved], (err) => {
            if (err) reject(err);
            else resolve();
          });
      });
    }
    console.log('✅ Created test users');

    // Add test cards
    const testCards = [
      { card_name: 'Ace of Beasts', owner: 'testuser1', deck: 'Beasts Deck' },
      { card_name: 'Two of Beasts', owner: 'testuser1', deck: 'Beasts Deck' },
      { card_name: 'Three of Beasts', owner: 'testuser2', deck: 'Beasts Deck' },
      { card_name: 'Four of Beasts', owner: 'testuser2', deck: 'Beasts Deck' },
      { card_name: 'Five of Beasts', owner: 'testuser1', deck: 'Beasts Deck' },
      { card_name: 'Six of Beasts', owner: 'testuser1', deck: 'Beasts Deck' },
      { card_name: 'Seven of Beasts', owner: 'testuser2', deck: 'Beasts Deck' },
      { card_name: 'Eight of Beasts', owner: 'testuser2', deck: 'Beasts Deck' },
      { card_name: 'Ace of Elementals', owner: 'testuser1', deck: 'Elementals Deck' },
      { card_name: 'Two of Elementals', owner: 'testuser2', deck: 'Elementals Deck' }
    ];

    for (const card of testCards) {
      await new Promise((resolve, reject) => {
        db.run(`INSERT OR REPLACE INTO cards (card_name, owner, deck) VALUES (?, ?, ?)`, 
          [card.card_name, card.owner, card.deck], (err) => {
            if (err) reject(err);
            else resolve();
          });
      });
    }
    console.log('✅ Created test cards');

    // Add test completed decks
    const testDecks = [
      { 
        deck_name: 'Beasts Deck', 
        total_cards: 8, 
        completed: 1 
      },
      { 
        deck_name: 'Elementals Deck', 
        total_cards: 8, 
        completed: 0 
      }
    ];

    for (const deck of testDecks) {
      await new Promise((resolve, reject) => {
        db.run(`INSERT OR REPLACE INTO decks (deck_name, total_cards, completed) VALUES (?, ?, ?)`, 
          [deck.deck_name, deck.total_cards, deck.completed], (err) => {
            if (err) reject(err);
            else resolve();
          });
      });
    }
    console.log('✅ Created test completed decks');

    // Add test deck requests
    const testDeckRequests = [
      { 
        username: 'testuser1', 
        deck: 'Portals Deck', 
        requested_at: new Date().toISOString(), 
        fulfilled: 0 
      },
      { 
        username: 'testuser2', 
        deck: 'Furies Deck', 
        requested_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        fulfilled: 0 
      }
    ];

    for (const request of testDeckRequests) {
      await new Promise((resolve, reject) => {
        db.run(`INSERT OR REPLACE INTO deck_requests (username, deck, requested_at, fulfilled) VALUES (?, ?, ?, ?)`, 
          [request.username, request.deck, request.requested_at, request.fulfilled], (err) => {
            if (err) reject(err);
            else resolve();
          });
      });
    }
    console.log('✅ Created test deck requests');

    // Add test notifications
    const testNotifications = [
      { 
        username: 'testuser1', 
        message: 'Your Beasts Deck has been completed!', 
        created_at: new Date().toISOString(),
        read: 0 
      },
      { 
        username: 'admin', 
        message: 'User pendinguser has registered and needs approval', 
        created_at: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        read: 0 
      }
    ];

    for (const notification of testNotifications) {
      await new Promise((resolve, reject) => {
        db.run(`INSERT OR REPLACE INTO notifications (username, message, created_at, read) VALUES (?, ?, ?, ?)`, 
          [notification.username, notification.message, notification.created_at, notification.read], (err) => {
            if (err) reject(err);
            else resolve();
          });
      });
    }
    console.log('✅ Created test notifications');

    // Add test activity log entries
    const testActivity = [
      { 
        username: 'admin', 
        action: 'User approved: testuser1', 
        timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
      },
      { 
        username: 'testuser1', 
        action: 'Added Ace of Beasts to Beasts Deck', 
        timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      },
      { 
        username: 'system', 
        action: 'Beasts Deck completed with 8 cards', 
        timestamp: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
      }
    ];

    for (const activity of testActivity) {
      await new Promise((resolve, reject) => {
        db.run(`INSERT OR REPLACE INTO activity (username, action, timestamp) VALUES (?, ?, ?)`, 
          [activity.username, activity.action, activity.timestamp], (err) => {
            if (err) reject(err);
            else resolve();
          });
      });
    }
    console.log('✅ Created test activity log entries');

    // Add test system updates
    await new Promise((resolve, reject) => {
      db.run(`INSERT OR REPLACE INTO system_updates (version, update_time, status, initiated_by) VALUES (?, ?, ?, ?)`, 
        ['1.1.2', new Date().toISOString(), 'completed', 'admin'], (err) => {
          if (err) reject(err);
          else resolve();
        });
    });
    console.log('✅ Created test system updates');

    // Add test Discord webhook config (optional)
    await new Promise((resolve, reject) => {
      db.run(`INSERT OR REPLACE INTO discord_webhook (id, url) VALUES (?, ?)`, 
        [1, 'https://discord.com/api/webhooks/example'], (err) => {
          if (err) reject(err);
          else resolve();
        });
    });
    console.log('✅ Created test Discord webhook config');

    console.log('\n🎉 Test data population completed!');
    console.log('\n📊 Summary:');
    console.log('   - 4 users (admin + 3 test users, 1 pending approval)');
    console.log('   - 10 cards across 2 decks');
    console.log('   - 2 deck definitions (1 completed, 1 in progress)');
    console.log('   - 2 deck requests (pending)');
    console.log('   - 2 notifications (1 for testuser1, 1 for admin)');
    console.log('   - 3 activity log entries');
    console.log('   - 1 system update record');
    console.log('   - 1 Discord webhook config');
    
    console.log('\n🚀 You can now test the admin panel at http://localhost:5000');
    console.log('   Admin login: admin / admin123');
    console.log('   Test user login: testuser1 / password123');

  } catch (error) {
    console.error('❌ Error populating test data:', error);
  } finally {
    db.close();
  }
}

populateTestData();
