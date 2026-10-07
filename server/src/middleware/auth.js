import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AppError } from '../utils/AppError.js';

export const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new AppError(401, 'Missing token');
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) throw new AppError(403, 'Forbidden');
  next();
};