import request from 'supertest';
import type { Client } from '@libsql/client';

process.env.JWT_SECRET = 'test-secret-for-quota-tests';

let testDb: Client;

jest.mock('../../db/index', () => ({
  ...jest.requireActual('../../db/index'),
  getDb: () => testDb,
}));

import app from '../app';

let authCookie: string;

beforeAll(async () => {
  const { createMemoryDb, initDb } = jest.requireActual('../../db/index');
  testDb = createMemoryDb();
  await initDb(testDb);

  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'quota@example.com', password: 'password123' });
  expect(res.status).toBe(201);
  authCookie = res.headers['set-cookie'][0];
});

describe('GET /api/user/quota', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/user/quota');
    expect(res.status).toBe(401);
  });

  it('returns used/limit/tier for authenticated user', async () => {
    const res = await request(app)
      .get('/api/user/quota')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      used: 0,
      limit: 100 * 1024 * 1024,
      tier: 'free',
    });
  });
});
