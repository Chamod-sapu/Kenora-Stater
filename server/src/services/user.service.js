import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { audit } from './audit.service.js';
import { publicUser } from './auth.service.js';

export async function create(data, actor) {
  const u = await User.create({
    name: data.name, email: data.email, role: data.role,
    passwordHash: await bcrypt.hash(data.password, 10), createdBy: actor.sub,
  });
  await audit(actor, 'user.create', 'User', u.id, { email: u.email, role: u.role });
  return publicUser(u);
}

export async function update(id, data, actor) {
  if (id === actor.sub && ((data.role && data.role !== 'admin') || data.isActive === false))
    throw new AppError(400, 'You cannot demote or deactivate your own account');
  const u = await User.findById(id);
  if (!u) throw new AppError(404, 'User not found');
  const from = { role: u.role, isActive: u.isActive };
  Object.assign(u, data);
  await u.save();
  await audit(actor, 'user.update', 'User', u.id, { from, to: data });
  return publicUser(u);
}

export const list = async () => (await User.find().sort('name')).map(publicUser);