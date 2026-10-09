import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as svc from '../services/user.service.js';
import { ROLES } from '../constants.js';

const r = Router();
r.use(requireAuth, requireRole('admin'));

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
  role: z.enum(ROLES),
});
const updateSchema = z.object({ role: z.enum(ROLES), isActive: z.boolean() }).partial();

r.get('/', async (req, res) => res.json({ users: await svc.list() }));
r.post('/', validate(createSchema), async (req, res) => res.status(201).json(await svc.create(req.body, req.user)));
r.patch('/:id', validate(updateSchema), async (req, res) => res.json(await svc.update(req.params.id, req.body, req.user)));

export default r;