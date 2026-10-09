import Workshop from '../models/Workshop.js';
import Registration from '../models/Registration.js';
import { AppError } from '../utils/AppError.js';

export async function register(workshopId, { name, email }, user) {
  // STEP 1: reserve a seat atomically. Check and increment happen in ONE operation on ONE document,
  // so concurrent requests can never push activeCount past capacity.
  const reserved = await Workshop.findOneAndUpdate(
    {
      _id: workshopId,
      status: 'scheduled',
      startsAt: { $gt: new Date() },
      $expr: { $lt: ['$activeCount', '$capacity'] },
    },
    { $inc: { activeCount: 1 } },
    { new: true }
  );

  if (!reserved) {
    const w = await Workshop.findById(workshopId);
    if (!w) throw new AppError(404, 'Workshop not found');
    if (w.status !== 'scheduled') throw new AppError(409, `This workshop is ${w.status}`);
    if (w.startsAt <= new Date()) throw new AppError(409, 'This workshop has already started');
    throw new AppError(409, 'This workshop is full');
  }

  // STEP 2: write the registration. If it fails, give the seat back.
  try {
    return await Registration.create({ workshop: workshopId, name, email, registeredBy: user.sub });
  } catch (e) {
    await Workshop.updateOne({ _id: workshopId }, { $inc: { activeCount: -1 } });
    if (e.code === 11000) throw new AppError(409, 'This email is already registered for this workshop');
    throw e;
  }
}

export async function cancel(registrationId, reason, user) {
  // Conditional flip: only ONE concurrent cancel can match status:'active', so only one frees a seat.
  const reg = await Registration.findOneAndUpdate(
    { _id: registrationId, status: 'active' },
    { $set: { status: 'cancelled', cancelledBy: user.sub, cancelledAt: new Date(), cancelReason: reason ?? '' } },
    { new: true }
  );
  if (!reg) {
    const exists = await Registration.exists({ _id: registrationId });
    throw exists ? new AppError(409, 'This registration is already cancelled') : new AppError(404, 'Registration not found');
  }
  await Workshop.updateOne({ _id: reg.workshop, activeCount: { $gt: 0 } }, { $inc: { activeCount: -1 } });
  return reg;
}

export async function listForWorkshop(workshopId, status = 'all') {
  if (!(await Workshop.exists({ _id: workshopId }))) throw new AppError(404, 'Workshop not found');
  const filter = { workshop: workshopId };
  if (status !== 'all') filter.status = status;
  return Registration.find(filter).sort({ createdAt: -1 }).populate('registeredBy cancelledBy', 'name');
}