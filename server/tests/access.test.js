import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDb, disconnectDb } from '../src/db.js';
import User from '../src/models/User.js';
import Workshop from '../src/models/Workshop.js';
import Registration from '../src/models/Registration.js';
import { as, makeUser, workshopBody } from './helpers.js';

const U = {};
let wid, rid, n = 0;
const models = [User, Workshop, Registration];

beforeAll(async () => {
  await connectDb('mongodb://127.0.0.1:27017/starter_test_ws_access');
  await Promise.all(models.map((m) => m.deleteMany({})));
  await Promise.all([Workshop.syncIndexes(), Registration.syncIndexes()]);
  U.admin = await makeUser('admin', 'a@t.com');
  U.manager = await makeUser('manager', 'm@t.com');
  U.staff = await makeUser('staff', 's@t.com');
  wid = (await request(app).post('/api/workshops').set(as(U.manager)).send(workshopBody({ capacity: 50 })).expect(201)).body.id;
  rid = (await request(app).post(`/api/workshops/${wid}/registrations`).set(as(U.manager)).send({ name: 'Seed', email: 'seed@x.com' }).expect(201)).body.id;
});
afterAll(async () => {
  await Promise.all(models.map((m) => m.deleteMany({})));
  await disconnectDb();
});

// [name, roles allowed, request builder]
const cases = [
  ['list workshops', ['manager', 'staff'], () => request(app).get('/api/workshops')],
  ['view workshop', ['manager', 'staff'], () => request(app).get(`/api/workshops/${wid}`)],
  ['create workshop', ['manager'], () => request(app).post('/api/workshops').send(workshopBody())],
  ['edit workshop', ['manager'], () => request(app).patch(`/api/workshops/${wid}`).send({ title: 'Renamed' })],
  ['set workshop status', ['manager'], () => request(app).patch(`/api/workshops/${wid}/status`).send({ status: 'completed' })],
  ['view registrations', ['manager', 'staff'], () => request(app).get(`/api/workshops/${wid}/registrations`)],
  ['register attendee', ['manager', 'staff'], () => request(app).post(`/api/workshops/${wid}/registrations`).send({ name: 'Pat', email: `p${n++}@x.com` })],
  ['cancel registration', ['manager', 'staff'], () => request(app).post(`/api/registrations/${rid}/cancel`).send({})],
  ['list users', ['admin'], () => request(app).get('/api/users')],
  ['create user', ['admin'], () => request(app).post('/api/users').send({ name: 'New', email: `n${n++}@x.com`, password: 'Passw0rd!', role: 'staff' })],
];

describe('permission matrix', () => {
  for (const [name, allowed, build] of cases) {
    for (const role of ['admin', 'manager', 'staff']) {
      it(`${name} as ${role}`, async () => {
        const res = await build().set(as(U[role]));
        if (allowed.includes(role)) expect([401, 403]).not.toContain(res.status);
        else expect(res.status).toBe(403);
      });
    }
  }
});

describe('auth rules', () => {
  it('rejects unauthenticated requests', async () => {
    await request(app).get('/api/workshops').expect(401);
  });

  it('has no public signup', async () => {
    await request(app).post('/api/auth/register').send({ name: 'x', email: 'x@x.com', password: 'Passw0rd!' }).expect(404);
  });

  it('applies role changes immediately (token role is not trusted)', async () => {
    const u = await makeUser('staff', 'demote@t.com');
    await request(app).get('/api/workshops').set(as(u)).expect(200);
    await request(app).patch(`/api/users/${u.id}`).set(as(U.admin)).send({ role: 'admin' }).expect(200);
    await request(app).get('/api/workshops').set(as(u)).expect(403);
  });

  it('blocks deactivated users straight away', async () => {
    const u = await makeUser('staff', 'off@t.com');
    await request(app).patch(`/api/users/${u.id}`).set(as(U.admin)).send({ isActive: false }).expect(200);
    await request(app).get('/api/workshops').set(as(u)).expect(401);
  });

  it('stops an admin demoting themselves', async () => {
    await request(app).patch(`/api/users/${U.admin.id}`).set(as(U.admin)).send({ role: 'manager' }).expect(400);
  });
});