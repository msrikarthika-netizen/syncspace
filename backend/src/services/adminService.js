import { isUuid, query } from '../config/dbConfig.js';
import aiService from './aiService.js';
import taskRepository from '../repositories/taskRepository.js';
import taskService from './taskService.js';
import adminRepository from '../repositories/adminRepository.js';
import { checkRedisHealth } from '../config/redisConfig.js';

const ROLES = new Set(['member', 'manager', 'admin']);
const TASK_STATUSES = new Set(['pending', 'queued', 'processing', 'completed', 'failed']);

const ensureUuid = (value, message) => {
  if (!isUuid(value)) throw new Error(message);
};

const toPagination = ({ page = 1, limit = 20 } = {}) => ({
  page: Math.max(1, Number.parseInt(page, 10) || 1),
  limit: Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20)),
});

class AdminService {
  async getDashboard() {
    return adminRepository.getDashboard();
  }

  async getUsers(filters) {
    const { page, limit } = toPagination(filters);
    const role = ROLES.has(filters.role) ? filters.role : undefined;
    const isActive = filters.isActive === 'true' ? true : filters.isActive === 'false' ? false : undefined;
    return adminRepository.listUsers({
      page,
      limit,
      role,
      isActive,
      search: typeof filters.search === 'string' ? filters.search.trim().slice(0, 120) : undefined,
    });
  }

  async updateUser({ targetUserId, actorId, updates, auditContext }) {
    ensureUuid(targetUserId, 'User not found');
    const target = await adminRepository.findUserById(targetUserId);
    if (!target) throw new Error('User not found');
    if (targetUserId === actorId && (updates.role !== undefined || updates.isActive !== undefined)) {
      throw new Error('Administrators cannot change their own role or account status');
    }

    const nextRole = updates.role !== undefined ? String(updates.role).toLowerCase() : undefined;
    if (nextRole && !ROLES.has(nextRole)) throw new Error('Invalid user role');
    if (updates.isActive !== undefined && typeof updates.isActive !== 'boolean') {
      throw new Error('isActive must be a boolean');
    }
    if (nextRole === undefined && updates.isActive === undefined) {
      throw new Error('Provide a role or account status change');
    }

    const removesLastAdmin =
      target.role === 'admin' &&
      target.isActive !== false &&
      (nextRole !== undefined && nextRole !== 'admin' || updates.isActive === false);
    if (removesLastAdmin && await adminRepository.countActiveAdmins() <= 1) {
      throw new Error('At least one active administrator must remain');
    }

    const user = await adminRepository.updateUser(targetUserId, {
      role: nextRole,
      isActive: updates.isActive,
    });
    await this.recordAudit({
      actorId,
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: targetUserId,
      metadata: { previousRole: target.role, nextRole: user.role, previousIsActive: target.isActive !== false, nextIsActive: user.isActive !== false },
      auditContext,
    });
    return user;
  }

  async getTasks(filters) {
    const { page, limit } = toPagination(filters);
    const status = TASK_STATUSES.has(filters.status) ? filters.status : undefined;
    return adminRepository.listTasks({
      page,
      limit,
      status,
      search: typeof filters.search === 'string' ? filters.search.trim().slice(0, 160) : undefined,
    });
  }

  async moderateTask({ taskId, action, reason, actorId, auditContext }) {
    ensureUuid(taskId, 'Task not found');
    const task = await adminRepository.findTaskForModeration(taskId);
    if (!task) throw new Error('Task not found');

    const moderationReason = typeof reason === 'string' ? reason.trim().slice(0, 500) : '';
    if (!['retry', 'mark_failed', 'delete'].includes(action)) throw new Error('Invalid moderation action');

    if (action === 'retry') {
      await adminRepository.prepareTaskRetry(taskId);
      const resetTask = await taskRepository.findById(taskId);
      await taskService.queueForAI(taskId, resetTask);
    } else if (action === 'mark_failed') {
      await taskService.failTaskFromAI(taskId, 'Manually stopped by an administrator');
    } else {
      await adminRepository.deleteTask(taskId);
    }

    await this.recordAudit({
      actorId,
      action: `TASK_${action.toUpperCase()}`,
      entityType: 'task',
      entityId: taskId,
      metadata: { title: task.title, reason: moderationReason || null },
      auditContext,
    });
    return { taskId, action };
  }

  async getReports(filters) {
    const { page, limit } = toPagination(filters);
    return adminRepository.listReports({
      page,
      limit,
      search: typeof filters.search === 'string' ? filters.search.trim().slice(0, 160) : undefined,
    });
  }

  async deleteReport({ reportId, reason, actorId, auditContext }) {
    ensureUuid(reportId, 'Report not found');
    const report = await adminRepository.deleteReport(reportId);
    if (!report) throw new Error('Report not found');
    await this.recordAudit({
      actorId,
      action: 'REPORT_DELETED',
      entityType: 'report',
      entityId: reportId,
      metadata: { title: report.title, taskId: report.task_id, reason: String(reason || '').trim().slice(0, 500) || null },
      auditContext,
    });
    return { reportId };
  }

  async getMonitoring() {
    const [database, ai, taskStatusResult, redis] = await Promise.all([
      query('SELECT NOW() AS checked_at').then(() => ({ status: 'healthy', detail: 'Database query succeeded' })).catch(() => ({ status: 'unhealthy', detail: 'Database query failed' })),
      aiService.healthCheck(),
      query("SELECT status, COUNT(*)::int AS count FROM tasks WHERE status IN ('queued', 'processing', 'failed') GROUP BY status"),
      checkRedisHealth(),
    ]);
    const queue = { queued: 0, processing: 0, failed: 0 };
    taskStatusResult.rows.forEach((row) => { queue[row.status] = row.count; });
    const aiHealthy = ai.status === 'ok';
    return {
      generatedAt: new Date().toISOString(),
      workflow: queue,
      services: [
        { key: 'backend', name: 'Backend API', status: 'healthy', detail: `Uptime ${Math.round(process.uptime())} seconds` },
        { key: 'database', name: 'PostgreSQL', ...database },
        { key: 'ai', name: 'AI orchestrator', status: aiHealthy ? 'healthy' : 'degraded', detail: aiHealthy ? `Model: ${ai.model || 'configured model'}` : 'Health endpoint is unreachable' },
        { key: 'redis', name: 'Redis', ...redis },
      ],
    };
  }

  async getAuditLogs(filters) {
    return adminRepository.listAuditLogs(toPagination(filters));
  }

  async recordAudit({ actorId, action, entityType, entityId, metadata, auditContext }) {
    return adminRepository.createAuditLog({
      actorId,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress: auditContext?.ipAddress,
      userAgent: auditContext?.userAgent,
    });
  }
}

export default new AdminService();
