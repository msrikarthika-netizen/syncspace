import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/config/dbConfig.js';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = path.resolve(scriptDirectory, '../migrations');

async function runMigrations() {
  const entries = await readdir(migrationsDirectory);
  // The repository uses one idempotent baseline schema file. Keep support for
  // future numbered .sql migrations without requiring a second script today.
  const files = [
    ...(entries.includes('old_sql_script') ? ['old_sql_script'] : []),
    ...entries.filter((file) => file.endsWith('.sql')).sort(),
  ];

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    for (const file of files) {
      const applied = await client.query('SELECT 1 FROM schema_migrations WHERE id = $1', [file]);
      if (applied.rowCount) continue;

      const sql = await readFile(path.join(migrationsDirectory, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`Applied migration ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((error) => {
  console.error('Database migration failed:', error.message);
  process.exit(1);
});
