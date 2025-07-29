// Integration test utilities and helpers
const { Pool } = require('pg');

class IntegrationHelpers {
  constructor() {
    this.testUsers = [];
    this.testCards = [];
  }

  async createTestUser(userData = {}) {
    const defaults = {
      username: `testuser_${Date.now()}`,
      password: 'testpass',
      role: 'user',
      approved: true
    };

    const user = { ...defaults, ...userData };
    
    // Store for cleanup
    this.testUsers.push(user.username);
    
    return user;
  }

  async createTestCard(cardData = {}) {
    const defaults = {
      card_name: `Test Card ${Date.now()} of Testing`,
      deck: 'Test Deck',
      username: 'testuser'
    };

    const card = { ...defaults, ...cardData };
    
    // Store for cleanup
    this.testCards.push(card.card_name);
    
    return card;
  }

  async cleanupTestData() {
    try {
      // Clean up test users
      for (const username of this.testUsers) {
        await this.deleteTestUser(username);
      }

      // Clean up test cards
      for (const cardName of this.testCards) {
        await this.deleteTestCard(cardName);
      }

      // Reset arrays
      this.testUsers = [];
      this.testCards = [];
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  }

  async deleteTestUser(username) {
    // Mock implementation - would connect to test database
    console.log(`Cleaning up test user: ${username}`);
  }

  async deleteTestCard(cardName) {
    // Mock implementation - would connect to test database
    console.log(`Cleaning up test card: ${cardName}`);
  }

  async setupTestDatabase() {
    // Initialize test database if needed
    console.log('Setting up test database...');
  }

  async teardownTestDatabase() {
    // Clean up test database
    console.log('Tearing down test database...');
  }

  generateRandomString(length = 10) {
    return Math.random().toString(36).substring(2, length + 2);
  }

  createMockRequest(data = {}) {
    return {
      body: data.body || {},
      params: data.params || {},
      query: data.query || {},
      headers: data.headers || {},
      user: data.user || null
    };
  }

  createMockResponse() {
    const res = {
      statusCode: 200,
      data: null,
      headers: {}
    };

    res.status = (code) => {
      res.statusCode = code;
      return res;
    };

    res.json = (data) => {
      res.data = data;
      return res;
    };

    res.send = (data) => {
      res.data = data;
      return res;
    };

    res.header = (key, value) => {
      res.headers[key] = value;
      return res;
    };

    return res;
  }

  async waitForServer(url = 'http://localhost:3001', timeout = 10000) {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          return true;
        }
      } catch (error) {
        // Server not ready yet
      }
      
      await this.sleep(100);
    }
    
    throw new Error(`Server at ${url} did not become ready within ${timeout}ms`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  validateApiResponse(response, expectedStatus = 200) {
    expect(response.statusCode).toBe(expectedStatus);
    
    if (expectedStatus >= 200 && expectedStatus < 300) {
      expect(response.body).toBeDefined();
    }
    
    if (expectedStatus >= 400) {
      expect(response.body).toHaveProperty('error');
    }
  }

  async measureResponseTime(testFunction) {
    const start = Date.now();
    const result = await testFunction();
    const end = Date.now();
    
    return {
      result,
      duration: end - start
    };
  }
}

// Global test helpers instance
const integrationHelpers = new IntegrationHelpers();

// Global setup and teardown
beforeAll(async () => {
  await integrationHelpers.setupTestDatabase();
});

afterAll(async () => {
  await integrationHelpers.teardownTestDatabase();
});

module.exports = { IntegrationHelpers, integrationHelpers };
