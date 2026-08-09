import taskRepository from '../repositories/taskRepository.js';
import SubTask from '../models/SubTask.js';
import aiService from './aiService.js';
import { getIO } from '../server/socketServer.js';
import { SOCKET_EVENTS } from '../utils/common/eventConstants.js';
import mongoose from 'mongoose';

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

    // Queue task for AI processing (async — don't await)
    this.queueForAI(task._id.toString(), task, userId).catch((err) => {
      console.error('AI queueing failed for task', task._id, err.message);
    });

    return task;
  }

  async queueForAI(taskId, taskData, userId) {
    const io = getIO();

    // Mark as queued
    await taskRepository.updateById(taskId, { status: 'queued', progress: 5 });
    io.to(`task:${taskId}`).emit(SOCKET_EVENTS.TASK_QUEUED, { taskId, progress: 5 });

    try {
      // Mark as processing
      await taskRepository.updateById(taskId, {
        status: 'processing',
        progress: 10,
        'aiMetadata.processingStartedAt': new Date(),
      });
      io.to(`task:${taskId}`).emit(SOCKET_EVENTS.TASK_PROCESSING, { taskId, progress: 10 });

      // Call Python AI service
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
      }
    } catch (err) {
      await taskRepository.updateById(taskId, { status: 'failed', progress: 0 });
      io.to(`task:${taskId}`).emit(SOCKET_EVENTS.TASK_FAILED, {
        taskId,
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
    if (!mongoose.Types.ObjectId.isValid(taskId)) throw new Error('Task not found');
    const task = await taskRepository.findWithSubtasks(taskId);
    if (!task) throw new Error('Task not found');
    if (userId && task.assignedBy?._id?.toString() !== userId && task.assignedBy?.toString() !== userId) {
      throw new Error('Unauthorized');
    }
    return task;
  }

  async getStats(userId) {
    const objId = new mongoose.Types.ObjectId(userId);
    const raw = await taskRepository.getStats(objId);
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
    if (!mongoose.Types.ObjectId.isValid(taskId)) throw new Error('Task not found');
    const task = await taskRepository.findById(taskId);
    if (!task) throw new Error('Task not found');
    if (task.assignedBy.toString() !== userId) throw new Error('Unauthorized');

    // Clean up subtasks
    if (task.subtasks?.length) {
      await SubTask.deleteMany({ parentTask: taskId });
    }
    await taskRepository.deleteById(taskId);
    return { deleted: true };
  }

  // Called from Python AI service via webhook to update subtask progress
  async updateSubtaskFromAI(taskId, subtaskData) {
    const io = getIO();
    const task = await taskRepository.findById(taskId);
    if (!task) throw new Error('Task not found');

    const status = subtaskData.status || 'running';

    // Upsert subtask
    const subtask = await SubTask.findOneAndUpdate(
      { parentTask: taskId, agentType: subtaskData.agent_type, title: subtaskData.title },
      {
        parentTask: taskId,
        title: subtaskData.title,
        description: subtaskData.description,
        agentType: subtaskData.agent_type,
        agentName: subtaskData.agent_name,
        status,
        result: subtaskData.result || '',
        error: subtaskData.error,
        order: subtaskData.order || 0,
        startedAt: subtaskData.started_at ? new Date(subtaskData.started_at) : undefined,
        completedAt: subtaskData.completed_at ? new Date(subtaskData.completed_at) : undefined,
        durationMs: subtaskData.duration_ms,
      },
      { upsert: true, returnDocument: 'after' }
    );

    const progress = Math.max(10, Math.min(95, Number(subtaskData.progress) || task.progress || 10));

    // Add to task if new
    await taskRepository.updateById(taskId, {
      $addToSet: { subtasks: subtask._id },
      status: 'processing',
      progress,
    });

    io.to(`task:${taskId}`).emit(SOCKET_EVENTS.TASK_PROGRESS, { taskId, progress });

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

    const eventName = status === 'running'
      ? SOCKET_EVENTS.SUBTASK_STARTED
      : SOCKET_EVENTS.SUBTASK_COMPLETED;

    // Emit real-time update
    io.to(`task:${taskId}`).emit(eventName, {
      taskId,
      subtask: subtaskPayload,
    });

    return subtask;
  }

  // Called from Python AI service via webhook if the entire orchestration fails
  async failTaskFromAI(taskId, errorMsg) {
    const io = getIO();
    await taskRepository.updateById(taskId, { status: 'failed', progress: 0 });
    io.to(`task:${taskId}`).emit(SOCKET_EVENTS.TASK_FAILED, {
      taskId,
      error: errorMsg || 'Unknown orchestration error',
    });
  }
}

export default new TaskService();
