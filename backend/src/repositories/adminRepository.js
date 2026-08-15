import { query, withTransaction } from '../config/dbConfig.js';
import { toIso, toUser } from '../utils/common/postgresMappers.js';

const toPublicAdminUser = (row) => {
  const user = toUser(row);
  if (!user) return null;
  return {
    _id: user._id,
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    taskCount: Number(row.task_count || 0),
    reportCount: Number(row.report_count || 0),
  };
};

const toModerationTask = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  priority: row.priority,
  status: row.status,
  progress: row.progress,
  tags: row.tags || [],
  reportId: row.report_id,
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
  owner: row.owner_id
    ? {
        id: row.owner_id,
        username: row.owner_username,
        email: row.owner_email,
        avatar: row.owner_avatar,
      }
    : null,
});

const toModerationReport = (row) => ({
  id: row.id,
  title: row.title,
  summary: row.summary,
  status: row.status,
  taskId: row.task_id,
  taskTitle: row.task_title,
  generatedBy: row.generated_by,
  generatedByUsername: row.generated_by_username,
  createdAt: toIso(row.created_at),
});

const toAuditLog = (row) => ({
  id: row.id,
  action: row.action,
  entityType: row.entity_type,
  entityId: row.entity_id,
  metadata: row.metadata || {},
  ipAddress: row.ip_address,
  userAgent: row.user_agent,
  createdAt: toIso(row.created_at),
  actor: row.actor_id
    ? {
        id: row.actor_id,
        username: row.actor_username,
        email: row.actor_email,
      }
    : null,
});

const addUserFilters = ({ search, role, isActive }, values) => {
  const clauses = [];
  if (search) {
    values.push(`%${search}%`);
    clauses.push(`(u.username ILIKE $${values.length} OR u.email ILIKE $${values.length})`);
  }
  if (role) {
    values.push(role);
    clauses.push(`u.role = $${values.length}`);
  }
  if (typeof isActive === 'boolean') {
    values.push(isActive);
    clauses.push(`COALESCE(u.is_active, TRUE) = $${values.length}`);
  }
  return clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
};

const addTaskFilters = ({ search, status }, values) => {
  const clauses = [];
  if (search) {
    values.push(`%${search}%`);
    clauses.push(`(t.title ILIKE $${values.length} OR t.description ILIKE $${values.length})`);
  }
  if (status) {
    values.push(status);
    clauses.push(`t.status = $${values.length}`);
  }
  return clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
};

class AdminRepository {
  async getDashboard() {
    const [countsResult, taskStatusResult, recentAuditLogs] = await Promise.all([
      query(`
        SELECT
          (SELECT COUNT(*)::int FROM app_users) AS users,
          (SELECT COUNT(*)::int FROM app_users WHERE COALESCE(is_active, TRUE)) AS active_users,
          (SELECT COUNT(*)::int FROM tasks) AS tasks,
          (SELECT COUNT(*)::int FROM reports) AS reports,
          (SELECT COUNT(*)::int FROM tasks WHERE status IN ('queued', 'processing')) AS active_tasks
      `),
      query('SELECT status, COUNT(*)::int AS count FROM tasks GROUP BY status'),
      this.listAuditLogs({ page: 1, limit: 8 }),
    ]);

    const taskStatuses = {
      pending: 0,
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };
    taskStatusResult.rows.forEach((row) => {
      taskStatuses[row.status] = row.count;
    });

    return {
      metrics: { ...countsResult.rows[0], taskStatuses },
      recentAuditLogs: recentAuditLogs.items,
    };
  }

  async listUsers({ page, limit, search, role, isActive }) {
    const filterValues = [];
    const where = addUserFilters({ search, role, isActive }, filterValues);
    const offset = (page - 1) * limit;
    const values = [...filterValues, limit, offset];
    const result = await query(
      `SELECT
        u.*,
        COUNT(DISTINCT t.id)::int AS task_count,
        COUNT(DISTINCT r.id)::int AS report_count
       FROM app_users u
       LEFT JOIN tasks t ON t.assigned_by = u.id
       LEFT JOIN reports r ON r.generated_by = u.id
       ${where}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );
    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM app_users u ${where}`,
      filterValues
    );
    return {
      items: result.rows.map(toPublicAdminUser),
      total: countResult.rows[0].total,
      page,
      limit,
    };
  }

  async findUserById(userId) {
    const result = await query('SELECT * FROM app_users WHERE id = $1', [userId]);
    return toUser(result.rows[0]);
  }

  async countActiveAdmins() {
    const result = await query(
      "SELECT COUNT(*)::int AS count FROM app_users WHERE role = 'admin' AND COALESCE(is_active, TRUE)"
    );
    return result.rows[0].count;
  }

  async updateUser(userId, updates) {
    const clauses = [];
    const values = [];
    if (updates.role !== undefined) {
      values.push(updates.role);
      clauses.push(`role = $${values.length}`);
    }
    if (updates.isActive !== undefined) {
      values.push(updates.isActive);
      clauses.push(`is_active = $${values.length}`);
    }
    if (!clauses.length) return this.findUserById(userId);

    values.push(userId);
    const result = await query(
      `UPDATE app_users SET ${clauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    return toPublicAdminUser(result.rows[0]);
  }

  async listTasks({ page, limit, search, status }) {
    const filterValues = [];
    const where = addTaskFilters({ search, status }, filterValues);
    const offset = (page - 1) * limit;
    const values = [...filterValues, limit, offset];
    const result = await query(
      `SELECT
        t.*,
        u.id AS owner_id,
        u.username AS owner_username,
        u.email AS owner_email,
        u.avatar AS owner_avatar
       FROM tasks t
       LEFT JOIN app_users u ON u.id = t.assigned_by
       ${where}
       ORDER BY t.created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );
    const countResult = await query(`SELECT COUNT(*)::int AS total FROM tasks t ${where}`, filterValues);
    return {
      items: result.rows.map(toModerationTask),
      total: countResult.rows[0].total,
      page,
      limit,
    };
  }

  async findTaskForModeration(taskId) {
    const result = await query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    return result.rows[0] || null;
  }

  async markTaskFailed(taskId) {
    const result = await query(
      "UPDATE tasks SET status = 'failed', progress = 0 WHERE id = $1 RETURNING *",
      [taskId]
    );
    return result.rows[0] || null;
  }

  async prepareTaskRetry(taskId) {
    return withTransaction(async (client) => {
      await client.query('UPDATE tasks SET report_id = NULL WHERE id = $1', [taskId]);
      await client.query('DELETE FROM reports WHERE task_id = $1', [taskId]);
      await client.query('DELETE FROM subtasks WHERE parent_task_id = $1', [taskId]);
      const result = await client.query(
        "UPDATE tasks SET status = 'pending', progress = 0 WHERE id = $1 RETURNING *",
        [taskId]
      );
      return result.rows[0] || null;
    });
  }

  async deleteTask(taskId) {
    return withTransaction(async (client) => {
      await client.query('UPDATE tasks SET report_id = NULL WHERE id = $1', [taskId]);
      await client.query('DELETE FROM reports WHERE task_id = $1', [taskId]);
      await client.query('DELETE FROM subtasks WHERE parent_task_id = $1', [taskId]);
      const result = await client.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [taskId]);
      return result.rows[0] || null;
    });
  }

  async listReports({ page, limit, search }) {
    const values = [];
    let where = '';
    if (search) {
      values.push(`%${search}%`);
      where = `WHERE r.title ILIKE $${values.length} OR r.summary ILIKE $${values.length}`;
    }
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT
        r.*, t.title AS task_title, u.username AS generated_by_username
       FROM reports r
       LEFT JOIN tasks t ON t.id = r.task_id
       LEFT JOIN app_users u ON u.id = r.generated_by
       ${where}
       ORDER BY r.created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );
    const countResult = await query(`SELECT COUNT(*)::int AS total FROM reports r ${where}`, values);
    return {
      items: result.rows.map(toModerationReport),
      total: countResult.rows[0].total,
      page,
      limit,
    };
  }

  async deleteReport(reportId) {
    return withTransaction(async (client) => {
      const reportResult = await client.query('SELECT * FROM reports WHERE id = $1', [reportId]);
      const report = reportResult.rows[0];
      if (!report) return null;
      await client.query('UPDATE tasks SET report_id = NULL WHERE id = $1', [report.task_id]);
      await client.query('DELETE FROM reports WHERE id = $1', [reportId]);
      return report;
    });
  }

  async createAuditLog({ actorId, action, entityType, entityId, metadata, ipAddress, userAgent }) {
    const result = await query(
      `INSERT INTO admin_audit_logs (
        actor_id, action, entity_type, entity_id, metadata, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
      RETURNING *`,
      [
        actorId,
        action,
        entityType,
        entityId || null,
        JSON.stringify(metadata || {}),
        ipAddress || null,
        userAgent || null,
      ]
    );
    return toAuditLog(result.rows[0]);
  }

  async listAuditLogs({ page, limit }) {
    const offset = (page - 1) * limit;
    const [result, countResult] = await Promise.all([
      query(
        `SELECT
          l.*, u.username AS actor_username, u.email AS actor_email
         FROM admin_audit_logs l
         LEFT JOIN app_users u ON u.id = l.actor_id
         ORDER BY l.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      query('SELECT COUNT(*)::int AS total FROM admin_audit_logs'),
    ]);
    return {
      items: result.rows.map(toAuditLog),
      total: countResult.rows[0].total,
      page,
      limit,
    };
  }
}

export default new AdminRepository();
