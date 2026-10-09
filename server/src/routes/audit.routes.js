import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';

const r = Router();
r.get('/', requireAuth, requireRole('admin', 'manager'), async (req, res) =>
  res.json({ items: await AuditLog.find().sort('-createdAt').limit(100) }));
export default r;