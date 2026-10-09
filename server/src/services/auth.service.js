import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config.js';
import { AppError } from '../utils/AppError.js';

const sign = (u) => jwt.sign({ sub: u.id }, config.jwtSecret, { expiresIn: '8h' });
export const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive });

export async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash)))
    throw new AppError(401, 'Invalid credentials');
  return { user: publicUser(user), token: sign(user) };
}