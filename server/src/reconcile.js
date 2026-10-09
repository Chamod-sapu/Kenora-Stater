import { connectDb, disconnectDb } from './db.js';
import Workshop from './models/Workshop.js';
import Registration from './models/Registration.js';

await connectDb();
const counts = await Registration.aggregate([{ $match: { status: 'active' } }, { $group: { _id: '$workshop', n: { $sum: 1 } } }]);
const byId = new Map(counts.map((c) => [String(c._id), c.n]));
for (const w of await Workshop.find().select('activeCount')) {
  const n = byId.get(String(w._id)) ?? 0;
  if (w.activeCount !== n) {
    await Workshop.updateOne({ _id: w._id }, { $set: { activeCount: n } });
    console.log(`Fixed ${w.id}: ${w.activeCount} -> ${n}`);
  }
}
console.log('Reconciled');
await disconnectDb();