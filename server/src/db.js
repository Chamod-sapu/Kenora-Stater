import mongoose from 'mongoose';
import { config } from './config.js';

export const connectDb = (uri = config.mongoUri) => mongoose.connect(uri);
export const disconnectDb = () => mongoose.disconnect();