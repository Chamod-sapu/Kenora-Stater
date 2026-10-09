import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new AppError(401, 'Missing token');
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
  const user = await User.findById(payload.sub).select('name role isActive');
  if (!user || !user.isActive) throw new AppError(401, 'Account not found or disabled');
  req.user = { sub: user.id, name: user.name, role: user.role };
  next();
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) throw new AppError(403, 'You do not have permission to do this');
  next();
};