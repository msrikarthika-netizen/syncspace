import pg from 'pg';
import { DATABASE_URL, IS_PRODUCTION, NODE_ENV } from './serverConfig.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl:
    IS_PRODUCTION && !DATABASE_URL.includes('localhost') && !DATABASE_URL.includes('127.0.0.1')
      ? { rejectUnauthorized: false }
      : false,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

export const query = (text, params = []) => pool.query(text, params);

export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || '')
  );

export default async function connectDB() {
  try {
    await pool.query('SELECT 1');
    console.log(`PostgreSQL connected in [${NODE_ENV}] environment`);
  } catch (error) {
    console.error('PostgreSQL connection failed:', error.message);
    process.exit(1);
  }
}
