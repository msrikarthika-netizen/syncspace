import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.BACKEND_PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const DEV_DATABASE_URL =
  process.env.DEV_DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/syncspace_dev';
export const PROD_DATABASE_URL =
  process.env.PROD_DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/syncspace_prod';
export const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  (IS_PRODUCTION ? PROD_DATABASE_URL : DEV_DATABASE_URL);
export const JWT_SECRET = process.env.JWT_SECRET || 'syncspace_dev_secret_change_in_prod';
export const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
export const REDIS_API_TOKEN = process.env.REDIS_API_TOKEN;
export const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
export const INTERNAL_WEBHOOK_SECRET =
  process.env.INTERNAL_WEBHOOK_SECRET ||
  (IS_PRODUCTION ? undefined : 'syncspace_internal_webhook_secret_change_this');
export const MAIL_HOST = process.env.MAIL_HOST;
export const MAIL_PORT = process.env.MAIL_PORT;
export const MAIL_USER = process.env.MAIL_USER;
export const MAIL_PASS = process.env.MAIL_PASS;
// The configured bootstrap administrator must already be a registered user.
// At startup the account is promoted and reactivated, which makes local/admin
// provisioning deterministic without storing a password in configuration.
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();
