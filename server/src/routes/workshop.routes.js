import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as workshops from '../services/workshop.service.js';
import * as regs from '../services/registration.service.js';
import { WORKSHOP_STATUSES } from '../constants.js';

const r = Router();
r.use(requireAuth);
const desk = requireRole('manager', 'staff'); // view + register + cancel
const manage = requireRole('manager');        // add + edit workshops

const shape = z.object({
  code: z.string().trim().toUpperCase().min(2).max(20),
  title: z.string().trim().min(3).max(120),
  instructor: z.string().trim().min(2).max(80),
  startsAt: z.coerce.date(),
  durationMinutes: z.number().int().min(15).max(600),
  capacity: z.number().int().min(1).max(500),
  location: z.string().trim().min(2).max(60),
  category: z.string().trim().max(40).optional(),
  description: z.string().trim().max(1000).optional(),
});
const createSchema = shape.refine((d) => d.startsAt > new Date(), { path: ['startsAt'], message: 'Must be in the future' });
const updateSchema = shape.partial();
const statusSchema = z.object({ status: z.enum(['completed', 'cancelled']) });
const regSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().toLowerCase().email() });

const listQuery = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(WORKSHOP_STATUSES).optional(),
  location: z.string().trim().max(60).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  hasSeats: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
  minSeats: z.coerce.number().int().min(1).max(500).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
const regListQuery = z.object({ status: z.enum(['all', 'active', 'cancelled']).default('all') });

r.get('/', desk, async (req, res) => res.json(await workshops.list(listQuery.parse(req.query))));
r.post('/', manage, validate(createSchema), async (req, res) => res.status(201).json(await workshops.create(req.body, req.user)));
r.get('/:id', desk, async (req, res) => res.json(await workshops.getById(req.params.id)));
r.patch('/:id', manage, validate(updateSchema), async (req, res) => res.json(await workshops.update(req.params.id, req.body, req.user)));
r.patch('/:id/status', manage, validate(statusSchema), async (req, res) =>
  res.json(await workshops.changeStatus(req.params.id, req.body.status, req.user)));

r.get('/:id/registrations', desk, async (req, res) =>
  res.json({ items: await regs.listForWorkshop(req.params.id, regListQuery.parse(req.query).status) }));
r.post('/:id/registrations', desk, validate(regSchema), async (req, res) =>
  res.status(201).json(await regs.register(req.params.id, req.body, req.user)));

export default r;