import mongoose from 'mongoose';
import { DEV_DB_URL, NODE_ENV, PROD_DB_URL } from './serverConfig.js';

export default async function connectDB() {
  try {
    const url = NODE_ENV === 'production' ? PROD_DB_URL : DEV_DB_URL;
    await mongoose.connect(url);
    console.log(`✅ MongoDB connected in [${NODE_ENV}] environment`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}
