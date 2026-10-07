import app from './app.js';
import { config } from './config.js';
import { connectDb } from './db.js';

await connectDb();
app.listen(config.port, () => console.log(`API running on :${config.port}`));