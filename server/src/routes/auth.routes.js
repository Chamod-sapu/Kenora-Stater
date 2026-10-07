import { Router } from 'express';
import { z } from 'zod';
import * as auth from '../services/auth.service.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';

const r = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

r.post('/register', validate(registerSchema), async (req, res) =>
  res.status(201).json(await auth.register(req.body)));

r.post('/login', validate(loginSchema), async (req, res) =>
  res.json(await auth.login(req.body)));

r.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.sub).select('-passwordHash');
  res.json({ user });
});

export default r;