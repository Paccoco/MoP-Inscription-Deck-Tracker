// User workflow integration tests
const request = require('supertest');
const app = require('../../server');

describe('User Workflow Integration', () => {
  let authToken;
  let userId;

  afterEach(async () => {
    // Clean up test data
    if (userId) {
      await integrationHelpers.cleanupTestData();
    }
  });

  describe('Complete User Registration and Login Flow', () => {
    it('should complete full user lifecycle', async () => {
      // 1. Register new user
      const registerRes = await request(app)
        .post('/api/register')
        .send({
          username: 'integrationuser',
          password: 'integrationpass123'
        });

      expect(registerRes.statusCode).toBe(201);
      expect(registerRes.body.message).toContain('registered');

      // 2. Login with new user
      const loginRes = await request(app)
        .post('/api/login')
        .send({
          username: 'integrationuser',
          password: 'integrationpass123'
        });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body).toHaveProperty('token');
      authToken = loginRes.body.token;

      // 3. Access profile
      const profileRes = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(profileRes.statusCode).toBe(200);
      expect(profileRes.body.username).toBe('integrationuser');
      userId = profileRes.body.id;

      // 4. Add a card
      const cardRes = await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          card_name: 'Integration Test Card of Testing',
          deck: 'Integration Deck'
        });

      expect(cardRes.statusCode).toBe(201);

      // 5. Verify card appears in listing
      const cardsRes = await request(app)
        .get('/api/cards');

      expect(cardsRes.statusCode).toBe(200);
      expect(cardsRes.body.some(card => 
        card.card_name === 'Integration Test Card of Testing'
      )).toBe(true);
    });
  });

  describe('Admin Workflow Integration', () => {
    let adminToken;

    beforeEach(async () => {
      // Create admin user
      const adminUser = await integrationHelpers.createTestUser({
        username: 'integrationadmin',
        role: 'admin'
      });

      // Login as admin
      const loginRes = await request(app)
        .post('/api/login')
        .send({
          username: 'integrationadmin',
          password: 'testpass'
        });

      adminToken = loginRes.body.token;
    });

    it('should handle admin operations', async () => {
      // 1. Access admin endpoints
      const usersRes = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(usersRes.statusCode).toBe(200);
      expect(Array.isArray(usersRes.body)).toBe(true);

      // 2. View completed decks
      const decksRes = await request(app)
        .get('/api/admin/completed-unallocated-decks')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(decksRes.statusCode).toBe(200);

      // 3. Check activity logs
      const activityRes = await request(app)
        .get('/api/admin/recent-activity')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(activityRes.statusCode).toBe(200);
    });

    it('should prevent non-admin access to admin endpoints', async () => {
      // Create regular user
      const regularUser = await integrationHelpers.createTestUser({
        username: 'regularuser',
        role: 'user'
      });

      const loginRes = await request(app)
        .post('/api/login')
        .send({
          username: 'regularuser',
          password: 'testpass'
        });

      const userToken = loginRes.body.token;

      // Try to access admin endpoint
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle database errors gracefully', async () => {
      // Test with malformed data that might cause DB errors
      const res = await request(app)
        .post('/api/register')
        .send({
          username: 'a'.repeat(1000), // Extremely long username
          password: 'testpass123'
        });

      // Should handle gracefully (either validation error or server error)
      expect([400, 500]).toContain(res.statusCode);
      expect(res.body).toHaveProperty('error');
    });

    it('should handle concurrent requests properly', async () => {
      // Create multiple simultaneous requests
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/register')
          .send({
            username: `concurrent${i}`,
            password: 'testpass123'
          })
      );

      const results = await Promise.all(promises);

      // All should either succeed or fail gracefully
      results.forEach(res => {
        expect([201, 409, 500]).toContain(res.statusCode);
      });
    });
  });

  describe('Performance Integration', () => {
    it('should handle multiple card operations efficiently', async () => {
      // Create test user
      const testUser = await integrationHelpers.createTestUser({
        username: 'perfuser'
      });

      const loginRes = await request(app)
        .post('/api/login')
        .send({
          username: 'perfuser',
          password: 'testpass'
        });

      authToken = loginRes.body.token;

      const startTime = Date.now();

      // Add multiple cards
      const cardPromises = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/cards')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            card_name: `Performance Test Card ${i} of Testing`,
            deck: 'Performance Deck'
          })
      );

      await Promise.all(cardPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000);

      // Verify all cards were added
      const cardsRes = await request(app)
        .get('/api/cards');

      const performanceCards = cardsRes.body.filter(card =>
        card.card_name.includes('Performance Test Card')
      );

      expect(performanceCards).toHaveLength(10);
    });
  });
});
