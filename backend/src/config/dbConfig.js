import pg from 'pg';
import { DATABASE_URL, IS_PRODUCTION, NODE_ENV } from './serverConfig.js';

const { Pool } = pg;

const databaseUrl = new URL(DATABASE_URL);
const isLocalDatabase = ['localhost', '127.0.0.1', '::1'].includes(databaseUrl.hostname);
const shouldUseTls = IS_PRODUCTION && !isLocalDatabase;

// pg is moving away from the ambiguous `require` SSL mode.  Use explicit
// hostname and certificate verification for every non-local production DB.
if (shouldUseTls) {
  databaseUrl.searchParams.set('sslmode', 'verify-full');
}

export const pool = new Pool({
  connectionString: databaseUrl.toString(),
  ssl: shouldUseTls ? { rejectUnauthorized: true } : false,
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
