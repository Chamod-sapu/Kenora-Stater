import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as regs from '../services/registration.service.js';

const r = Router();
r.use(requireAuth);

const cancelSchema = z.object({ reason: z.string().trim().max(200) }).partial();

r.post('/:id/cancel', requireRole('manager', 'staff'), validate(cancelSchema), async (req, res) =>
  res.json(await regs.cancel(req.params.id, req.body.reason, req.user)));

export default r;