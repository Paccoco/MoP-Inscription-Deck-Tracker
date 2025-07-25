// Basic Express API endpoint tests using supertest and jest
const request = require('supertest');
const app = require('../server-auth');

describe('API Endpoints', () => {
  it('GET /api/cards should return cards', async () => {
    const res = await request(app).get('/api/cards');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/completed-decks should return completed decks', async () => {
    const res = await request(app).get('/api/completed-decks');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/activity should return activity log', async () => {
    const res = await request(app).get('/api/activity');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
