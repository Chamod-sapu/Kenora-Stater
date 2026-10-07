import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config.js';
import { AppError } from '../utils/AppError.js';

const sign = (u) => jwt.sign({ sub: u.id, role: u.role }, config.jwtSecret, { expiresIn: '8h' });
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

export async function register({ name, email, password }) {
  // Role is never taken from the request body, so users can't make themselves admin.
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10) });
  return { user: publicUser(user), token: sign(user) };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    throw new AppError(401, 'Invalid credentials');
  return { user: publicUser(user), token: sign(user) };
}