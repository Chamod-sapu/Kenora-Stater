import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import User from '../src/models/User.js';

export const as = (u) => ({ Authorization: `Bearer ${u.token}` });

export async function makeUser(role, email) {
  const doc = await User.create({ name: email, email, role, passwordHash: await bcrypt.hash('Passw0rd!', 4) });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'Passw0rd!' });
  return { id: doc.id, token: res.body.token };
}

export const workshopBody = (over = {}) => ({
  code: `W${Math.random().toString(36).slice(2, 8)}`,
  title: 'Test workshop', instructor: 'Tester',
  startsAt: new Date(Date.now() + 3 * 86400000).toISOString(),
  durationMinutes: 60, capacity: 5, location: 'Lakeside', ...over,
});