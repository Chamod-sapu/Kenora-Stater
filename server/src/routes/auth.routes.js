import { Router } from 'express';
import { z } from 'zod';
import * as auth from '../services/auth.service.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';

const r = Router();
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

r.post('/login', validate(loginSchema), async (req, res) => res.json(await auth.login(req.body)));
r.get('/me', requireAuth, async (req, res) => res.json({ user: auth.publicUser(await User.findById(req.user.sub)) }));

export default r;