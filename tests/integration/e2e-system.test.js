// End-to-end system integration tests
const request = require('supertest');
const app = require('../../server');
const { integrationHelpers } = require('./helpers');

describe('E2E System Integration', () => {
  describe('Complete Card Tracking Workflow', () => {
    let userToken;
    let adminToken;
    let testCards = [];

    beforeAll(async () => {
      // Create test users
      const testUser = await integrationHelpers.createTestUser({
        username: 'e2euser',
        role: 'user'
      });

      const adminUser = await integrationHelpers.createTestUser({
        username: 'e2eadmin',
        role: 'admin'
      });

      // Login users
      const userLogin = await request(app)
        .post('/api/login')
        .send({
          username: 'e2euser',
          password: 'testpass'
        });

      const adminLogin = await request(app)
        .post('/api/login')
        .send({
          username: 'e2eadmin',
          password: 'testpass'
        });

      userToken = userLogin.body.token;
      adminToken = adminLogin.body.token;
    });

    afterAll(async () => {
      await integrationHelpers.cleanupTestData();
    });

    it('should complete full card tracking lifecycle', async () => {
      // 1. User adds cards to track deck completion
      const cardsToAdd = [
        'E2E Test Card One of Testing',
        'E2E Test Card Two of Testing',
        'E2E Test Card Three of Testing',
        'E2E Test Card Four of Testing'
      ];

      const deckName = 'E2E Test Deck';

      // Add cards
      for (const cardName of cardsToAdd) {
        const res = await request(app)
          .post('/api/cards')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            card_name: cardName,
            deck: deckName
          });

        expect(res.statusCode).toBe(201);
        testCards.push(cardName);
      }

      // 2. Verify cards appear in listing
      const cardsRes = await request(app)
        .get('/api/cards');

      expect(cardsRes.statusCode).toBe(200);
      
      const addedCards = cardsRes.body.filter(card =>
        cardsToAdd.includes(card.card_name)
      );
      expect(addedCards).toHaveLength(4);

      // 3. Admin views incomplete decks
      const incompleteRes = await request(app)
        .get('/api/admin/incomplete-decks')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(incompleteRes.statusCode).toBe(200);
      
      // Should find our test deck
      const testDeck = incompleteRes.body.find(deck => 
        deck.deck === deckName
      );
      expect(testDeck).toBeDefined();
      expect(testDeck.missing_cards).toBeGreaterThan(0);

      // 4. Complete the deck by adding remaining cards
      // (This would typically be done by admin or other users)
      const remainingCards = [
        'E2E Completion Card One of Testing',
        'E2E Completion Card Two of Testing'
      ];

      for (const cardName of remainingCards) {
        await request(app)
          .post('/api/cards')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            card_name: cardName,
            deck: deckName
          });
        
        testCards.push(cardName);
      }

      // 5. Check completed decks
      const completedRes = await request(app)
        .get('/api/admin/completed-unallocated-decks')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(completedRes.statusCode).toBe(200);

      // 6. Verify activity logging
      const activityRes = await request(app)
        .get('/api/admin/recent-activity')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(activityRes.statusCode).toBe(200);
      expect(Array.isArray(activityRes.body)).toBe(true);

      // Should contain our activities
      const ourActivities = activityRes.body.filter(activity =>
        activity.details && activity.details.includes('E2E Test')
      );
      expect(ourActivities.length).toBeGreaterThan(0);
    });
  });

  describe('System Health and Performance', () => {
    it('should maintain system health under load', async () => {
      const { result, duration } = await integrationHelpers.measureResponseTime(async () => {
        // Simulate concurrent operations
        const operations = [];

        // Multiple user registrations
        for (let i = 0; i < 5; i++) {
          operations.push(
            request(app)
              .post('/api/register')
              .send({
                username: `loadtest${i}_${Date.now()}`,
                password: 'loadtestpass'
              })
          );
        }

        // Multiple card additions
        for (let i = 0; i < 10; i++) {
          operations.push(
            request(app)
              .get('/api/cards')
          );
        }

        return await Promise.allSettled(operations);
      });

      // Should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds

      // Check that most operations succeeded
      const successful = result.filter(op => 
        op.status === 'fulfilled' && 
        op.value.statusCode >= 200 && 
        op.value.statusCode < 400
      );

      expect(successful.length).toBeGreaterThan(result.length * 0.8); // 80% success rate
    });

    it('should handle error scenarios gracefully', async () => {
      // Test various error conditions
      const errorTests = [
        // Invalid authentication
        request(app)
          .get('/api/profile')
          .set('Authorization', 'Bearer invalid-token'),

        // Missing required fields
        request(app)
          .post('/api/cards')
          .send({}),

        // Non-existent endpoints
        request(app)
          .get('/api/nonexistent'),

        // Malformed JSON
        request(app)
          .post('/api/register')
          .set('Content-Type', 'application/json')
          .send('invalid json')
      ];

      const results = await Promise.allSettled(errorTests);

      // All should handle errors gracefully (no crashes)
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
        
        // Should return appropriate error codes
        const response = result.value;
        expect(response.statusCode).toBeGreaterThanOrEqual(400);
        expect(response.statusCode).toBeLessThan(600);
      });
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain data consistency across operations', async () => {
      // Create test user
      const testUser = await integrationHelpers.createTestUser({
        username: 'consistencyuser'
      });

      const loginRes = await request(app)
        .post('/api/login')
        .send({
          username: 'consistencyuser',
          password: 'testpass'
        });

      const token = loginRes.body.token;

      // Add a card
      const cardRes = await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${token}`)
        .send({
          card_name: 'Consistency Test Card of Testing',
          deck: 'Consistency Deck'
        });

      expect(cardRes.statusCode).toBe(201);

      // Verify card appears in multiple endpoints
      const cardsRes = await request(app)
        .get('/api/cards');

      const userCardsRes = await request(app)
        .get('/api/user-cards')
        .set('Authorization', `Bearer ${token}`);

      // Card should appear in both listings
      expect(cardsRes.body.some(card => 
        card.card_name === 'Consistency Test Card of Testing'
      )).toBe(true);

      expect(userCardsRes.body.some(card => 
        card.card_name === 'Consistency Test Card of Testing'
      )).toBe(true);

      // Verify user attribution
      const addedCard = cardsRes.body.find(card => 
        card.card_name === 'Consistency Test Card of Testing'
      );
      expect(addedCard.username).toBe('consistencyuser');
    });
  });

  describe('Security Integration', () => {
    it('should enforce authentication and authorization', async () => {
      // Test unauthenticated access
      const unauthTests = [
        request(app).get('/api/profile'),
        request(app).post('/api/cards').send({ card_name: 'Test', deck: 'Test' }),
        request(app).get('/api/admin/users'),
        request(app).get('/api/user-cards')
      ];

      const unauthResults = await Promise.all(unauthTests);
      
      unauthResults.forEach(res => {
        expect(res.statusCode).toBe(401);
      });

      // Test regular user trying to access admin endpoints
      const userRes = await request(app)
        .post('/api/login')
        .send({
          username: 'e2euser',
          password: 'testpass'
        });

      const adminAttempts = [
        request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${userRes.body.token}`),
        
        request(app)
          .get('/api/admin/completed-unallocated-decks')
          .set('Authorization', `Bearer ${userRes.body.token}`)
      ];

      const adminResults = await Promise.all(adminAttempts);
      
      adminResults.forEach(res => {
        expect(res.statusCode).toBe(403);
      });
    });
  });
});
