import { query } from '../config/dbConfig.js';
import { toUser } from '../utils/common/postgresMappers.js';

class UserRepository {
  async create({ username, email, passwordHash, role = 'member', avatar }) {
    const result = await query(
      `INSERT INTO app_users (username, email, password_hash, role, avatar)
       VALUES ($1, LOWER($2), $3, $4, $5)
       RETURNING *`,
      [
        username.trim(),
        email,
        passwordHash,
        role,
        avatar || `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(username)}`,
      ]
    );
    return toUser(result.rows[0]);
  }

  async findById(id) {
    const result = await query('SELECT * FROM app_users WHERE id = $1', [id]);
    return toUser(result.rows[0]);
  }

  async findByEmail(email) {
    const result = await query('SELECT * FROM app_users WHERE email = LOWER($1)', [email]);
    return toUser(result.rows[0]);
  }

  async findByUsername(username) {
    const result = await query('SELECT * FROM app_users WHERE username = $1', [username]);
    return toUser(result.rows[0]);
  }

  async updateUsername(id, username) {
    const result = await query(
      'UPDATE app_users SET username = $1 WHERE id = $2 RETURNING *',
      [username, id]
    );
    return toUser(result.rows[0]);
  }

  async promoteAndActivateByEmail(email) {
    const result = await query(
      `UPDATE app_users
       SET role = 'admin', is_active = TRUE
       WHERE email = LOWER($1)
       RETURNING *`,
      [email]
    );
    return toUser(result.rows[0]);
  }
}

export default new UserRepository();
