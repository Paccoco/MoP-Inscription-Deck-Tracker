// Authentication API tests
const request = require('supertest');
const app = require('../../server');
const bcrypt = require('bcrypt');

describe('Authentication API', () => {
  let testUser;
  
  beforeEach(async () => {
    // Create test user
    const db = require('../../src/utils/database-adapter');
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, password, role, approved) VALUES (?, ?, ?, ?)',
        ['testuser', hashedPassword, 'user', 1],
        function(err) {
          if (err) reject(err);
          testUser = { id: this.lastID, username: 'testuser' };
          resolve();
        }
      );
    });
  });

  afterEach(async () => {
    // Clean up test data
    const db = require('../../src/utils/database-adapter');
    await new Promise((resolve) => {
      db.run('DELETE FROM users WHERE username = ?', ['testuser'], resolve);
    });
  });

  describe('POST /api/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          username: 'testuser',
          password: 'testpass123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('role', 'user');
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          username: 'nonexistent',
          password: 'anypassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should validate input format', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          username: '', // Empty username
          password: 'test'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/register', () => {
    it('should register new user successfully', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({
          username: 'newuser',
          password: 'newpass123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message');
    });

    it('should reject duplicate username', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({
          username: 'testuser', // Already exists
          password: 'anypass123'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty('error');
    });

    it('should validate password strength', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({
          username: 'newuser',
          password: '123' // Too weak
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/profile', () => {
    let authToken;

    beforeEach(async () => {
      // Get auth token
      const loginRes = await request(app)
        .post('/api/login')
        .send({
          username: 'testuser',
          password: 'testpass123'
        });
      authToken = loginRes.body.token;
    });

    it('should return user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('username', 'testuser');
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/profile');

      expect(res.statusCode).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.statusCode).toBe(403);
    });
  });
});
