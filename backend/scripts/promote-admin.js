import { pool } from '../src/config/dbConfig.js';

const email = process.argv[2]?.trim();

if (!email) {
  console.error('Usage: npm run admin:promote -- user@example.com');
  process.exit(1);
}

try {
  const result = await pool.query(
    `UPDATE app_users
     SET role = 'admin', is_active = TRUE
     WHERE email = LOWER($1)
     RETURNING id, username, email, role`,
    [email]
  );

  if (!result.rowCount) {
    console.error('No user found with that email address.');
    process.exitCode = 1;
  } else {
    console.log(`Promoted ${result.rows[0].email} to admin.`);
  }
} catch (error) {
  console.error('Admin promotion failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
