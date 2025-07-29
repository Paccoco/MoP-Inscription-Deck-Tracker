// API test setup
const { initializeDatabase } = require('../src/utils/database-adapter');

// Set up test database before API tests
beforeAll(async () => {
  // Use in-memory SQLite for API tests to avoid PostgreSQL setup complexity
  process.env.DB_TYPE = 'sqlite';
  process.env.DB_PATH = ':memory:';
  
  // Initialize test database
  await initializeDatabase();
});

// Clean up after tests
afterAll(async () => {
  // Close database connections
  const db = require('../src/utils/database-adapter');
  if (db.close) {
    db.close();
  }
});

// Reset database state between tests
beforeEach(async () => {
  // Clear test data between tests if needed
  // This can be expanded based on test requirements
});
