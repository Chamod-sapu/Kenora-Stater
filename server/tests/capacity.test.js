import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDb, disconnectDb } from '../src/db.js';
import User from '../src/models/User.js';
import Workshop from '../src/models/Workshop.js';
import Registration from '../src/models/Registration.js';
import { as, makeUser, workshopBody } from './helpers.js';

let manager, staff;
const models = [User, Workshop, Registration];

const mk = async (capacity) =>
  (await request(app).post('/api/workshops').set(as(manager)).send(workshopBody({ capacity })).expect(201)).body;
const reg = (wid, email, who = staff) =>
  request(app).post(`/api/workshops/${wid}/registrations`).set(as(who)).send({ name: 'Person', email });
const cancel = (rid, who = staff) => request(app).post(`/api/registrations/${rid}/cancel`).set(as(who)).send({ reason: 'test' });
const counter = async (wid) => (await Workshop.findById(wid)).activeCount;
const activeRecords = (wid) => Registration.countDocuments({ workshop: wid, status: 'active' });

beforeAll(async () => {
  await connectDb('mongodb://127.0.0.1:27017/starter_test_ws_capacity');
  await Promise.all(models.map((m) => m.deleteMany({})));
  await Promise.all([Workshop.syncIndexes(), Registration.syncIndexes()]);
  manager = await makeUser('manager', 'm@t.com');
  staff = await makeUser('staff', 's@t.com');
});
afterAll(async () => {
  await Promise.all(models.map((m) => m.deleteMany({})));
  await disconnectDb();
});

describe('capacity rule under concurrency', () => {
  it('never exceeds capacity when 30 people race for 5 seats', async () => {
    const w = await mk(5);
    const results = await Promise.all(Array.from({ length: 30 }, (_, i) => reg(w.id, `p${i}@x.com`)));
    expect(results.filter((r) => r.status === 201)).toHaveLength(5);
    expect(results.filter((r) => r.status === 409)).toHaveLength(25);
    expect(await activeRecords(w.id)).toBe(5);
    expect(await counter(w.id)).toBe(5);
  });

  it('the same email registered concurrently wins once and keeps the counter correct', async () => {
    const w = await mk(10);
    const results = await Promise.all(Array.from({ length: 6 }, () => reg(w.id, 'same@x.com')));
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(await activeRecords(w.id)).toBe(1);
    expect(await counter(w.id)).toBe(1);
  });

  it('concurrent cancels of one registration free exactly one seat', async () => {
    const w = await mk(3);
    const r = await reg(w.id, 'a@x.com').expect(201);
    await reg(w.id, 'b@x.com').expect(201);
    const results = await Promise.all(Array.from({ length: 5 }, () => cancel(r.body.id)));
    expect(results.filter((x) => x.status === 200)).toHaveLength(1);
    expect(await counter(w.id)).toBe(1);
  });
});

describe('registration lifecycle and history', () => {
  it('a cancelled seat can be taken, and the old record is kept with who and when', async () => {
    const w = await mk(1);
    const a = await reg(w.id, 'a@x.com').expect(201);
    await reg(w.id, 'b@x.com').expect(409);                 // full
    await cancel(a.body.id, manager).expect(200);
    await reg(w.id, 'b@x.com').expect(201);                 // freed seat is usable

    const rec = await Registration.findById(a.body.id);
    expect(rec.status).toBe('cancelled');                   // never deleted
    expect(String(rec.cancelledBy)).toBe(manager.id);
    expect(rec.cancelledAt).toBeTruthy();
    expect(String(rec.registeredBy)).toBe(staff.id);

    const hist = await request(app).get(`/api/workshops/${w.id}/registrations`).set(as(staff)).expect(200);
    expect(hist.body.items).toHaveLength(2);
  });

  it('allows the same person to re-register after cancelling, keeping both records', async () => {
    const w = await mk(5);
    const first = await reg(w.id, 'back@x.com').expect(201);
    await cancel(first.body.id).expect(200);
    await reg(w.id, 'back@x.com').expect(201);
    expect(await Registration.countDocuments({ workshop: w.id, email: 'back@x.com' })).toBe(2);
  });

  it('rejects registering for a cancelled workshop', async () => {
    const w = await mk(5);
    await request(app).patch(`/api/workshops/${w.id}/status`).set(as(manager)).send({ status: 'cancelled' }).expect(200);
    await reg(w.id, 'late@x.com').expect(409);
  });

  it('refuses to lower capacity below current registrations', async () => {
    const w = await mk(3);
    for (const e of ['1', '2', '3']) await reg(w.id, `${e}@x.com`).expect(201);
    await request(app).patch(`/api/workshops/${w.id}`).set(as(manager)).send({ capacity: 2 }).expect(409);
    await request(app).patch(`/api/workshops/${w.id}`).set(as(manager)).send({ capacity: 4 }).expect(200);
  });
});

describe('finding workshops', () => {
  it('filters by seats available and by status', async () => {
    const full = await mk(1);
    await reg(full.id, 'f@x.com').expect(201);
    const res = await request(app).get('/api/workshops?hasSeats=true&status=scheduled').set(as(staff)).expect(200);
    expect(res.body.items.every((w) => w.seatsAvailable > 0)).toBe(true);
    expect(res.body.items.map((w) => w.id)).not.toContain(full.id);
  });
});