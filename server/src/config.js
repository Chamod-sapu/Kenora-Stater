import 'dotenv/config';

export const config = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/starter',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
};