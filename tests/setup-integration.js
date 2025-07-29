// Integration test setup
const { initializeDatabase } = require('../src/utils/database-adapter');

// Set up real database for integration tests
beforeAll(async () => {
  // Use SQLite for integration tests to avoid PostgreSQL dependency in CI
  process.env.DB_TYPE = 'sqlite';
  process.env.DB_PATH = './test-integration.db';
  
  // Initialize test database with schema
  await initializeDatabase();
});

// Clean up after all tests
afterAll(async () => {
  // Close database connections
  const db = require('../src/utils/database-adapter');
  if (db.close) {
    db.close();
  }
  
  // Clean up test database file
  const fs = require('fs');
  if (fs.existsSync('./test-integration.db')) {
    fs.unlinkSync('./test-integration.db');
  }
});

// Helper functions for integration tests
global.integrationHelpers = {
  // Create test user
  createTestUser: async (userData = {}) => {
    const db = require('../src/utils/database-adapter');
    const bcrypt = require('bcrypt');
    
    const defaultUser = {
      username: 'testuser',
      password: await bcrypt.hash('testpass', 10),
      role: 'user',
      approved: true,
      ...userData
    };
    
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, password, role, approved) VALUES (?, ?, ?, ?)',
        [defaultUser.username, defaultUser.password, defaultUser.role, defaultUser.approved],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...defaultUser });
        }
      );
    });
  },
  
  // Clean up test data
  cleanupTestData: async () => {
    const db = require('../src/utils/database-adapter');
    return new Promise((resolve) => {
      db.run('DELETE FROM users WHERE username LIKE "test%"', resolve);
    });
  }
};
