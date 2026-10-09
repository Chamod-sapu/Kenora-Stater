import Workshop from '../models/Workshop.js';
import Registration from '../models/Registration.js';
import { AppError } from '../utils/AppError.js';

export async function register(workshopId, { name, email }, user) {
  let status = 'active';

  // STEP 1: try to reserve a seat atomically.
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
    status = 'waitlisted'; // Workshop is full, queue the attendee
  }

  // STEP 2: write the registration. If it fails, give the seat back if active.
  try {
    return await Registration.create({ workshop: workshopId, name, email, status, registeredBy: user.sub });
  } catch (e) {
    if (status === 'active') {
      await Workshop.updateOne({ _id: workshopId }, { $inc: { activeCount: -1 } });
    }
    if (e.code === 11000) throw new AppError(409, 'This email is already registered for this workshop');
    throw e;
  }
}

export async function cancel(registrationId, reason, user) {
  const reg = await Registration.findOneAndUpdate(
    { _id: registrationId, status: { $in: ['active', 'waitlisted'] } },
    { $set: { status: 'cancelled', cancelledBy: user.sub, cancelledAt: new Date(), cancelReason: reason ?? '' } },
    { new: false } // get original document to know previous status
  );
  if (!reg) {
    const exists = await Registration.exists({ _id: registrationId });
    throw exists ? new AppError(409, 'This registration is already cancelled') : new AppError(404, 'Registration not found');
  }

  if (reg.status === 'active') {
    // Try to promote the oldest waitlisted user for this workshop
    const promoted = await Registration.findOneAndUpdate(
      { workshop: reg.workshop, status: 'waitlisted' },
      { $set: { status: 'active' } },
      { sort: { createdAt: 1 }, new: true }
    );

    if (!promoted) {
      await Workshop.updateOne({ _id: reg.workshop, activeCount: { $gt: 0 } }, { $inc: { activeCount: -1 } });
    }
  }

  reg.status = 'cancelled';
  reg.cancelledBy = user.sub;
  reg.cancelledAt = new Date();
  reg.cancelReason = reason ?? '';
  return reg;
}

export async function listForWorkshop(workshopId, status = 'all') {
  if (!(await Workshop.exists({ _id: workshopId }))) throw new AppError(404, 'Workshop not found');
  const filter = { workshop: workshopId };
  if (status !== 'all') filter.status = status;
  return Registration.find(filter).sort({ createdAt: -1 }).populate('registeredBy cancelledBy', 'name');
}