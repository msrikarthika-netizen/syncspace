import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.BACKEND_PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const MONGO_URI = process.env.MONGO_URI;
export const DEV_DB_URL =
  MONGO_URI || process.env.DEV_DB_URL || 'mongodb://localhost:27017/syncspace_dev';
export const PROD_DB_URL =
  MONGO_URI || process.env.PROD_DB_URL || 'mongodb://localhost:27017/syncspace_prod';
export const JWT_SECRET = process.env.JWT_SECRET || 'syncspace_dev_secret_change_in_prod';
export const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
export const REDIS_API_TOKEN = process.env.REDIS_API_TOKEN;
export const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
export const INTERNAL_WEBHOOK_SECRET =
  process.env.INTERNAL_WEBHOOK_SECRET ||
  (IS_PRODUCTION ? undefined : 'syncspace_dev_internal_webhook_secret');
export const MAIL_HOST = process.env.MAIL_HOST;
export const MAIL_PORT = process.env.MAIL_PORT;
export const MAIL_USER = process.env.MAIL_USER;
export const MAIL_PASS = process.env.MAIL_PASS;
