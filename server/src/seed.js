import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from './db.js';
import User from './models/User.js';
import Workshop from './models/Workshop.js';
import Registration from './models/Registration.js';
import AuditLog from './models/AuditLog.js';

await connectDb();
await Promise.all([User, Workshop, Registration, AuditLog].map((m) => m.deleteMany({})));
await Promise.all([Workshop.syncIndexes(), Registration.syncIndexes()]);

const hash = (p) => bcrypt.hash(p, 10);
const [admin, manager, staff] = await User.create([
  { name: 'Ayesha Admin', email: 'admin@demo.com', role: 'admin', passwordHash: await hash('Admin123!') },
  { name: 'Mahesh Manager', email: 'manager@demo.com', role: 'manager', passwordHash: await hash('Manager123!') },
  { name: 'Sanduni Staff', email: 'staff@demo.com', role: 'staff', passwordHash: await hash('Staff123!') },
]);

const at = (days, hour) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0); return d; };
const defs = [
  { code: 'POT-101', title: 'Intro to Pottery', instructor: 'Nimali Perera', startsAt: at(1, 10), durationMinutes: 120, capacity: 8, filled: 8, location: 'Lakeside', category: 'Crafts' },
  { code: 'COD-201', title: 'Web Basics with HTML', instructor: 'Kasun Silva', startsAt: at(2, 14), durationMinutes: 180, capacity: 20, filled: 12, location: 'City Centre', category: 'Coding' },
  { code: 'FIT-110', title: 'Morning Fitness', instructor: 'Dilani Fernando', startsAt: at(3, 7), durationMinutes: 60, capacity: 15, filled: 3, location: 'North Centre', category: 'Fitness' },
  { code: 'POT-102', title: 'Wheel Throwing', instructor: 'Nimali Perera', startsAt: at(5, 14), durationMinutes: 120, capacity: 10, filled: 0, location: 'Lakeside', category: 'Crafts' },
  { code: 'COD-202', title: 'Python for Beginners', instructor: 'Kasun Silva', startsAt: at(9, 9), durationMinutes: 180, capacity: 12, filled: 12, location: 'City Centre', category: 'Coding' },
  { code: 'FIT-111', title: 'Evening Yoga', instructor: 'Dilani Fernando', startsAt: at(12, 17), durationMinutes: 60, capacity: 15, filled: 5, location: 'North Centre', category: 'Fitness' },
  { code: 'ART-120', title: 'Watercolour Basics', instructor: 'Ruwan Jayasuriya', startsAt: at(-3, 10), durationMinutes: 120, capacity: 10, filled: 7, location: 'Lakeside', category: 'Art', status: 'completed' },
];

for (const { filled, ...d } of defs) {
  const w = await Workshop.create({ ...d, activeCount: filled, createdBy: manager.id });
  if (filled) {
    await Registration.insertMany(
      Array.from({ length: filled }, (_, i) => ({
        workshop: w.id, name: `Guest ${i + 1}`, email: `guest${i + 1}.${d.code.toLowerCase()}@example.com`, registeredBy: staff.id,
      }))
    );
  }
  if (d.code === 'POT-101') // a cancelled record so the history view has something to show
    await Registration.create({
      workshop: w.id, name: 'Former Guest', email: 'former@example.com', status: 'cancelled',
      registeredBy: staff.id, cancelledBy: manager.id, cancelledAt: new Date(), cancelReason: 'Changed plans',
    });
}

console.log('Seeded. Logins: admin@demo.com / Admin123!, manager@demo.com / Manager123!, staff@demo.com / Staff123!');
await disconnectDb();