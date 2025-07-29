// Global test setup - runs before all tests
require('dotenv').config({ path: '.env.test' });

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Global test utilities
global.testUtils = {
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock JWT token for testing
  mockToken: 'mock-jwt-token-for-testing',
  
  // Test user data
  testUser: {
    id: 1,
    username: 'testuser',
    role: 'user',
    approved: true
  },
  
  testAdmin: {
    id: 2,
    username: 'testadmin',
    role: 'admin',
    approved: true
  }
};

// Setup process exit handling for tests
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});
