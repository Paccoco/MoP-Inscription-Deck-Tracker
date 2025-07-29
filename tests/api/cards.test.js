// Cards API tests
const request = require('supertest');
const app = require('../../server');
const bcrypt = require('bcrypt');

describe('Cards API', () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    // Create test user and get auth token
    const db = require('../../src/utils/database-adapter');
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, password, role, approved) VALUES (?, ?, ?, ?)',
        ['cardtestuser', hashedPassword, 'user', 1],
        function(err) {
          if (err) reject(err);
          testUser = { id: this.lastID, username: 'cardtestuser' };
          resolve();
        }
      );
    });

    const loginRes = await request(app)
      .post('/api/login')
      .send({
        username: 'cardtestuser',
        password: 'testpass123'
      });
    authToken = loginRes.body.token;
  });

  afterEach(async () => {
    // Clean up test data
    const db = require('../../src/utils/database-adapter');
    await new Promise((resolve) => {
      db.run('DELETE FROM users WHERE username = ?', ['cardtestuser'], resolve);
    });
    await new Promise((resolve) => {
      db.run('DELETE FROM cards WHERE owner = ?', [testUser?.id], resolve);
    });
  });

  describe('GET /api/cards', () => {
    it('should return all cards', async () => {
      const res = await request(app)
        .get('/api/cards');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should include card properties', async () => {
      // First add a test card
      await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          card_name: 'Test Card of Testing',
          deck: 'Test Deck'
        });

      const res = await request(app)
        .get('/api/cards');

      expect(res.statusCode).toBe(200);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('id');
        expect(res.body[0]).toHaveProperty('card_name');
        expect(res.body[0]).toHaveProperty('deck');
      }
    });
  });

  describe('POST /api/cards', () => {
    it('should add card with valid auth', async () => {
      const res = await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          card_name: 'New Test Card of Testing',
          deck: 'Test Deck'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message');
    });

    it('should reject card without auth', async () => {
      const res = await request(app)
        .post('/api/cards')
        .send({
          card_name: 'Test Card of Testing',
          deck: 'Test Deck'
        });

      expect(res.statusCode).toBe(401);
    });

    it('should validate card data', async () => {
      const res = await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          card_name: '', // Empty name
          deck: 'Test Deck'
        });

      expect(res.statusCode).toBe(400);
    });

    it('should handle missing deck', async () => {
      const res = await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          card_name: 'Test Card of Testing'
          // Missing deck
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/cards/:id', () => {
    let testCardId;

    beforeEach(async () => {
      // Create a test card
      const addRes = await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          card_name: 'Delete Test Card of Testing',
          deck: 'Test Deck'
        });

      // Get the card ID from database
      const db = require('../../src/utils/database-adapter');
      await new Promise((resolve, reject) => {
        db.get('SELECT id FROM cards WHERE card_name = ?', ['Delete Test Card of Testing'], (err, row) => {
          if (err) reject(err);
          testCardId = row?.id;
          resolve();
        });
      });
    });

    it('should delete own card', async () => {
      if (!testCardId) {
        throw new Error('Test card was not created');
      }

      const res = await request(app)
        .delete(`/api/cards/${testCardId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
    });

    it('should reject delete without auth', async () => {
      if (!testCardId) {
        throw new Error('Test card was not created');
      }

      const res = await request(app)
        .delete(`/api/cards/${testCardId}`);

      expect(res.statusCode).toBe(401);
    });

    it('should handle non-existent card', async () => {
      const res = await request(app)
        .delete('/api/cards/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
