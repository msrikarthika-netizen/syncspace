import { query } from '../config/dbConfig.js';
import { toSubtask } from '../utils/common/postgresMappers.js';

class SubtaskRepository {
  async upsertFromAI(taskId, subtaskData) {
    const result = await query(
      `INSERT INTO subtasks (
        parent_task_id, title, description, agent_type, agent_name, status,
        result, error, sort_order, started_at, completed_at, duration_ms
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (parent_task_id, agent_type, title)
       DO UPDATE SET
        description = EXCLUDED.description,
        agent_name = EXCLUDED.agent_name,
        status = EXCLUDED.status,
        result = EXCLUDED.result,
        error = EXCLUDED.error,
        sort_order = EXCLUDED.sort_order,
        started_at = COALESCE(EXCLUDED.started_at, subtasks.started_at),
        completed_at = EXCLUDED.completed_at,
        duration_ms = EXCLUDED.duration_ms
       RETURNING *`,
      [
        taskId,
        subtaskData.title,
        subtaskData.description,
        subtaskData.agent_type,
        subtaskData.agent_name,
        subtaskData.status || 'running',
        subtaskData.result || '',
        subtaskData.error || null,
        subtaskData.order || 0,
        subtaskData.started_at || null,
        subtaskData.completed_at || null,
        subtaskData.duration_ms || null,
      ]
    );
    return toSubtask(result.rows[0]);
  }

  async deleteByTask(taskId) {
    await query('DELETE FROM subtasks WHERE parent_task_id = $1', [taskId]);
  }
}

export default new SubtaskRepository();
