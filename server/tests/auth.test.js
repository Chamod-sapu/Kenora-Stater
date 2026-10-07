import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDb, disconnectDb } from '../src/db.js';
import User from '../src/models/User.js';

beforeAll(async () => {
  await connectDb('mongodb://localhost:27017/starter_test');
  await User.deleteMany({});
});
afterAll(async () => {
  await User.deleteMany({});
  await disconnectDb();
});

describe('auth', () => {
  const creds = { name: 'Test User', email: 't@t.com', password: 'Passw0rd!' };

  it('registers and logs in', async () => {
    await request(app).post('/api/auth/register').send(creds).expect(201);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: creds.email, password: creds.password })
      .expect(200);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects a wrong password', async () => {
    await request(app).post('/api/auth/login').send({ email: creds.email, password: 'wrong' }).expect(401);
  });

  it('blocks /me without a token', async () => {
    await request(app).get('/api/auth/me').expect(401);
  });
});