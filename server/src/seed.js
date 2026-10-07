import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from './db.js';
import User from './models/User.js';

await connectDb();
await User.deleteMany({});
await User.create([
  { name: 'Admin', email: 'admin@demo.com', role: 'admin', passwordHash: await bcrypt.hash('Admin123!', 10) },
  { name: 'Agent', email: 'agent@demo.com', role: 'agent', passwordHash: await bcrypt.hash('Agent123!', 10) },
]);
console.log('Seeded');
await disconnectDb();