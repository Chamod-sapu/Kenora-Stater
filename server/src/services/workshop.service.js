import Workshop from '../models/Workshop.js';
import { AppError } from '../utils/AppError.js';
import { audit } from './audit.service.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function create(data, user) {
  const w = await Workshop.create({ ...data, createdBy: user.sub });
  await audit(user, 'workshop.create', 'Workshop', w.id, { code: w.code });
  return w;
}

export async function getById(id) {
  const w = await Workshop.findById(id);
  if (!w) throw new AppError(404, 'Workshop not found');
  return w;
}

export async function update(id, data, user) {
  const filter = { _id: id, status: 'scheduled' };
  // Atomic guard: the update only applies if the new capacity still covers current registrations.
  if (data.capacity !== undefined) filter.activeCount = { $lte: data.capacity };

  const w = await Workshop.findOneAndUpdate(filter, { $set: data }, { new: true, runValidators: true });
  if (!w) {
    const cur = await getById(id);
    if (cur.status !== 'scheduled') throw new AppError(409, `A ${cur.status} workshop cannot be edited`);
    throw new AppError(409, `Capacity cannot be lower than the ${cur.activeCount} active registrations`);
  }
  await audit(user, 'workshop.update', 'Workshop', w.id, { changes: data });
  return w;
}

export async function changeStatus(id, to, user) {
  const w = await Workshop.findOneAndUpdate({ _id: id, status: 'scheduled' }, { $set: { status: to } }, { new: true });
  if (!w) {
    const cur = await getById(id);
    throw new AppError(409, `Workshop is already ${cur.status}`);
  }
  await audit(user, `workshop.${to}`, 'Workshop', w.id);
  return w;
}

export async function list(q) {
  const filter = {};
  if (q.status) filter.status = q.status;
  if (q.location) filter.location = q.location;
  if (q.from || q.to) {
    filter.startsAt = {};
    if (q.from) filter.startsAt.$gte = q.from;
    if (q.to) filter.startsAt.$lte = q.to;
  }
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), 'i');
    filter.$or = [{ title: rx }, { code: rx }, { instructor: rx }];
  }
  // Seats available = capacity - activeCount, computed in the query (no stored duplicate to go stale)
  const seats = { $subtract: ['$capacity', '$activeCount'] };
  const exprs = [];
  if (q.hasSeats) exprs.push({ $gt: [seats, 0] });
  if (q.minSeats) exprs.push({ $gte: [seats, q.minSeats] });
  if (exprs.length) filter.$expr = { $and: exprs };

  const [items, total] = await Promise.all([
    Workshop.find(filter).sort({ startsAt: 1 }).skip((q.page - 1) * q.limit).limit(q.limit),
    Workshop.countDocuments(filter),
  ]);
  return { items, total, page: q.page, pages: Math.max(1, Math.ceil(total / q.limit)) };
}

export async function getStats() {
  const all = await Workshop.find();
  const totalCapacity = all.reduce((s, w) => s + (w.capacity || 0), 0);
  const totalBooked   = all.reduce((s, w) => s + (w.activeCount || 0), 0);
  const bookedPct     = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;
  
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const scheduledCnt  = all.filter((w) => w.status === 'scheduled' && w.startsAt >= now && w.startsAt <= nextWeek).length;
  
  const uniqueInstructors = new Set(all.map((w) => w.instructor).filter(Boolean)).size;

  return { totalCapacity, totalBooked, bookedPct, scheduledCnt, uniqueInstructors };
}