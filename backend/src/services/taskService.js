import taskRepository from '../repositories/taskRepository.js';
import subtaskRepository from '../repositories/subtaskRepository.js';
import aiService from './aiService.js';
import { getIO } from '../server/socketServer.js';
import { SOCKET_EVENTS } from '../utils/common/eventConstants.js';
import { isUuid } from '../config/dbConfig.js';

class TaskService {
  async createTask({ title, description, priority, tags, deadline, userId, workspaceId }) {
    const task = await taskRepository.create({
      title,
      description,
      priority: priority || 'medium',
      tags: tags || [],
      deadline,
      assignedBy: userId,
      workspace: workspaceId,
      status: 'pending',
      progress: 0,
    });

    this.queueForAI(task._id, task).catch((err) => {
      console.error('AI queueing failed for task', task._id, err.message);
    });

    return task;
  }

  async queueForAI(taskId, taskData) {
    const io = getIO();

    await taskRepository.updateById(taskId, { status: 'queued', progress: 5 });
    io.to(`task:${taskId}`).emit(SOCKET_EVENTS.TASK_QUEUED, {
      taskId,
      status: 'queued',
      progress: 5,
    });

    try {
      await taskRepository.updateById(taskId, {
        status: 'processing',
        progress: 10,
        'aiMetadata.processingStartedAt': new Date(),
      });
      io.to(`task:${taskId}`).emit(SOCKET_EVENTS.TASK_PROCESSING, {
        taskId,
        status: 'processing',
        progress: 10,
      });

      const aiResult = await aiService.processTask(taskId, taskData);

      if (aiResult.status === 'completed') {
        await taskRepository.updateById(taskId, {
          status: 'completed',
          progress: 100,
          'aiMetadata.processingCompletedAt': new Date(),
          report: aiResult.report_id,
        });
        io.to(`task:${taskId}`).emit(SOCKET_EVENTS.TASK_COMPLETED, {
          taskId,
          progress: 100,
          reportId: aiResult.report_id,
        });
        return;
      }

      if (['queued', 'processing'].includes(aiResult.status)) {
        return;
      }

      throw new Error(aiResult.message || `AI service returned unexpected status: ${aiResult.status}`);
    } catch (err) {
      await taskRepository.updateById(taskId, { status: 'failed', progress: 0 });
      io.to(`task:${taskId}`).emit(SOCKET_EVENTS.TASK_FAILED, {
        taskId,
        status: 'failed',
        error: err.message,
      });
    }
  }

  async getTasksByUser(userId, filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    return await taskRepository.findByUser(userId, query);
  }

  async getTaskById(taskId, userId) {
    if (!isUuid(taskId)) throw new Error('Task not found');
    const task = await taskRepository.findWithSubtasks(taskId);
    if (!task) throw new Error('Task not found');
    const ownerId = task.assignedBy?._id || task.assignedBy;
    if (userId && ownerId !== userId) {
      throw new Error('Unauthorized');
    }
    return task;
  }

  async getStats(userId) {
    const raw = await taskRepository.getStats(userId);
    const stats = {
      total: 0,
      pending: 0,
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };
    raw.forEach(({ _id, count }) => {
      stats[_id] = count;
      stats.total += count;
    });
    return stats;
  }

  async deleteTask(taskId, userId) {
    if (!isUuid(taskId)) throw new Error('Task not found');
    const task = await taskRepository.findById(taskId);
    if (!task) throw new Error('Task not found');
    const ownerId = task.assignedBy?._id || task.assignedBy;
    if (ownerId !== userId) throw new Error('Unauthorized');

    await subtaskRepository.deleteByTask(taskId);
    await taskRepository.deleteById(taskId);
    return { deleted: true };
  }

  async updateSubtaskFromAI(taskId, subtaskData) {
    const io = getIO();
    const task = await taskRepository.findById(taskId);
    if (!task) throw new Error('Task not found');

    const status = subtaskData.status || 'running';
    const subtask = await subtaskRepository.upsertFromAI(taskId, { ...subtaskData, status });
    const progress = Math.max(10, Math.min(95, Number(subtaskData.progress) || task.progress || 10));

    await taskRepository.updateById(taskId, {
      status: 'processing',
      progress,
    });

    io.to(`task:${taskId}`).emit(SOCKET_EVENTS.TASK_PROGRESS, {
      taskId,
      status: 'processing',
      progress,
    });

    const subtaskPayload = {
      id: subtask._id,
      title: subtask.title,
      description: subtask.description,
      agentType: subtask.agentType,
      agentName: subtask.agentName,
      status: subtask.status,
      result: subtask.result,
      error: subtask.error,
      order: subtask.order,
      startedAt: subtask.startedAt,
      completedAt: subtask.completedAt,
      durationMs: subtask.durationMs,
    };

    const eventName =
      status === 'running' ? SOCKET_EVENTS.SUBTASK_STARTED : SOCKET_EVENTS.SUBTASK_COMPLETED;

    io.to(`task:${taskId}`).emit(eventName, {
      taskId,
      subtask: subtaskPayload,
    });

    return subtask;
  }

  async failTaskFromAI(taskId, errorMsg) {
    const io = getIO();
    await taskRepository.updateById(taskId, { status: 'failed', progress: 0 });
    io.to(`task:${taskId}`).emit(SOCKET_EVENTS.TASK_FAILED, {
      taskId,
      status: 'failed',
      error: errorMsg || 'Unknown orchestration error',
    });
  }
}

export default new TaskService();
