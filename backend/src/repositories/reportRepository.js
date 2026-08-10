import { query } from '../config/dbConfig.js';
import { toReport } from '../utils/common/postgresMappers.js';

const reportSelect = `
  SELECT
    r.*,
    CASE WHEN t.id IS NULL THEN NULL ELSE jsonb_build_object(
      '_id', t.id::text,
      'id', t.id::text,
      'title', t.title,
      'description', t.description,
      'priority', t.priority,
      'status', t.status,
      'assignedBy', t.assigned_by::text
    ) END AS task,
    CASE WHEN u.id IS NULL THEN NULL ELSE jsonb_build_object(
      '_id', u.id::text,
      'id', u.id::text,
      'username', u.username,
      'avatar', u.avatar
    ) END AS generated_by_user
  FROM reports r
  LEFT JOIN tasks t ON t.id = r.task_id
  LEFT JOIN app_users u ON u.id = r.generated_by
`;

class ReportRepository {
  async findByTask(taskId) {
    const result = await query(`${reportSelect} WHERE r.task_id = $1`, [taskId]);
    return toReport(result.rows[0]);
  }

  async upsertForTask(taskId, data) {
    const result = await query(
      `INSERT INTO reports (
        task_id, generated_by, title, summary, sections, full_content, stats, status
      )
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7::jsonb, $8)
       ON CONFLICT (task_id)
       DO UPDATE SET
        generated_by = EXCLUDED.generated_by,
        title = EXCLUDED.title,
        summary = EXCLUDED.summary,
        sections = EXCLUDED.sections,
        full_content = EXCLUDED.full_content,
        stats = EXCLUDED.stats,
        status = EXCLUDED.status
       RETURNING *`,
      [
        taskId,
        data.generatedBy || null,
        data.title,
        data.summary,
        JSON.stringify(data.sections || []),
        data.fullContent || '',
        JSON.stringify(data.stats || {}),
        data.status || 'ready',
      ]
    );
    return toReport(result.rows[0]);
  }

  async findByIdWithTask(reportId) {
    const result = await query(`${reportSelect} WHERE r.id = $1`, [reportId]);
    return toReport(result.rows[0]);
  }

  async findByUser(userId) {
    const result = await query(
      `${reportSelect} WHERE r.generated_by = $1 ORDER BY r.created_at DESC`,
      [userId]
    );
    return result.rows.map(toReport);
  }
}

export default new ReportRepository();
