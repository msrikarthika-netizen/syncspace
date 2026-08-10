import { query } from '../config/dbConfig.js';
import { toTask } from '../utils/common/postgresMappers.js';

const taskSelect = `
  SELECT
    t.*,
    CASE WHEN u.id IS NULL THEN NULL ELSE jsonb_build_object(
      '_id', u.id::text,
      'id', u.id::text,
      'username', u.username,
      'email', u.email,
      'avatar', u.avatar,
      'role', u.role
    ) END AS assigned_by_user,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        '_id', s.id::text,
        'id', s.id::text,
        'parentTask', s.parent_task_id::text,
        'title', s.title,
        'description', s.description,
        'agentType', s.agent_type,
        'agentName', s.agent_name,
        'status', s.status,
        'result', s.result,
        'error', s.error,
        'startedAt', s.started_at,
        'completedAt', s.completed_at,
        'durationMs', s.duration_ms,
        'order', s.sort_order,
        'metadata', s.metadata,
        'createdAt', s.created_at,
        'updatedAt', s.updated_at
      ) ORDER BY s.sort_order ASC, s.created_at ASC)
      FROM subtasks s
      WHERE s.parent_task_id = t.id
    ), '[]'::jsonb) AS subtasks,
    CASE WHEN r.id IS NULL THEN NULL ELSE jsonb_build_object(
      '_id', r.id::text,
      'id', r.id::text,
      'title', r.title,
      'summary', r.summary,
      'status', r.status,
      'createdAt', r.created_at
    ) END AS report
  FROM tasks t
  LEFT JOIN app_users u ON u.id = t.assigned_by
  LEFT JOIN reports r ON r.id = t.report_id
`;

class TaskRepository {
  async create(data) {
    const result = await query(
      `INSERT INTO tasks (
        title, description, priority, tags, deadline, assigned_by, workspace_id, status, progress
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.title.trim(),
        data.description.trim(),
        data.priority || 'medium',
        data.tags || [],
        data.deadline || null,
        data.assignedBy,
        data.workspace || null,
        data.status || 'pending',
        data.progress ?? 0,
      ]
    );
    return toTask(result.rows[0]);
  }

  async findById(taskId) {
    const result = await query(`${taskSelect} WHERE t.id = $1`, [taskId]);
    return toTask(result.rows[0]);
  }

  async findByUser(userId, filter = {}) {
    const clauses = ['t.assigned_by = $1'];
    const values = [userId];

    if (filter.status) {
      values.push(filter.status);
      clauses.push(`t.status = $${values.length}`);
    }
    if (filter.priority) {
      values.push(filter.priority);
      clauses.push(`t.priority = $${values.length}`);
    }

    const result = await query(
      `${taskSelect} WHERE ${clauses.join(' AND ')} ORDER BY t.created_at DESC`,
      values
    );
    return result.rows.map(toTask);
  }

  async findWithSubtasks(taskId) {
    return this.findById(taskId);
  }

  async updateById(taskId, data) {
    const values = [];
    const clauses = [];

    const addValue = (value) => {
      values.push(value);
      return `$${values.length}`;
    };

    const directFields = {
      title: 'title',
      description: 'description',
      priority: 'priority',
      status: 'status',
      progress: 'progress',
      deadline: 'deadline',
      tags: 'tags',
      report: 'report_id',
      assignedBy: 'assigned_by',
      workspace: 'workspace_id',
    };

    Object.entries(directFields).forEach(([key, column]) => {
      if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined) {
        clauses.push(`${column} = ${addValue(data[key])}`);
      }
    });

    const aiMetadataFields = {
      'aiMetadata.orchestratorModel': ['orchestratorModel', 'text'],
      'aiMetadata.totalAgentsUsed': ['totalAgentsUsed', 'int'],
      'aiMetadata.processingStartedAt': ['processingStartedAt', 'text'],
      'aiMetadata.processingCompletedAt': ['processingCompletedAt', 'text'],
      'aiMetadata.processingDurationMs': ['processingDurationMs', 'int'],
    };

    Object.entries(aiMetadataFields).forEach(([key, [jsonKey, type]]) => {
      if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined) {
        const value = data[key] instanceof Date ? data[key].toISOString() : data[key];
        const placeholder = addValue(value);
        const cast = type === 'int' ? 'int' : 'text';
        clauses.push(
          `ai_metadata = jsonb_set(COALESCE(ai_metadata, '{}'::jsonb), '{${jsonKey}}', to_jsonb(${placeholder}::${cast}), true)`
        );
      }
    });

    if (clauses.length) {
      values.push(taskId);
      await query(`UPDATE tasks SET ${clauses.join(', ')} WHERE id = $${values.length}`, values);
    }

    return this.findById(taskId);
  }

  async updateProgress(taskId, progress, status) {
    return this.updateById(taskId, { progress, status });
  }

  async deleteById(taskId) {
    const task = await this.findById(taskId);
    if (!task) return null;
    await query('DELETE FROM tasks WHERE id = $1', [taskId]);
    return task;
  }

  async getStats(userId) {
    const result = await query(
      `SELECT status AS _id, COUNT(*)::int AS count
       FROM tasks
       WHERE assigned_by = $1
       GROUP BY status`,
      [userId]
    );
    return result.rows;
  }
}

export default new TaskRepository();
