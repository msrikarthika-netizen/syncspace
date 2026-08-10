import reportRepository from '../repositories/reportRepository.js';
import taskRepository from '../repositories/taskRepository.js';
import { getIO } from '../server/socketServer.js';
import { SOCKET_EVENTS } from '../utils/common/eventConstants.js';
import mongoose from 'mongoose';

class ReportService {
  async createReport({ taskId, reportData, userId }) {
    const io = getIO();
    const task = await taskRepository.findById(taskId);
    if (!task) throw new Error('Task not found');
    const generatedBy = userId || task.assignedBy;

    const report = await reportRepository.upsertForTask(taskId, {
      task: taskId,
      generatedBy,
      title: reportData.title,
      summary: reportData.summary,
      sections: reportData.sections || [],
      fullContent: reportData.full_content || '',
      stats: reportData.stats || {},
      status: 'ready',
    });

    const taskStatus = reportData.task_status === 'failed' ||
      Number(reportData.stats?.failedSubtasks || 0) > 0
      ? 'failed'
      : 'completed';

    // Link report to task
    await taskRepository.updateById(taskId, {
      report: report._id,
      status: taskStatus,
      progress: taskStatus === 'completed' ? 100 : 0,
      'aiMetadata.processingCompletedAt': new Date(),
      'aiMetadata.totalAgentsUsed': reportData.stats?.agentsUsed?.length || 0,
    });

    // Notify all listeners on this task's room
    io.to(`task:${taskId}`).emit(SOCKET_EVENTS.REPORT_READY, {
      taskId,
      reportId: report._id,
    });
    if (taskStatus === 'completed') {
      io.to(`task:${taskId}`).emit(SOCKET_EVENTS.TASK_COMPLETED, {
        taskId,
        status: 'completed',
        progress: 100,
        reportId: report._id,
      });
    } else {
      io.to(`task:${taskId}`).emit(SOCKET_EVENTS.TASK_FAILED, {
        taskId,
        status: 'failed',
        error: 'One or more AI agents failed. Review the generated report.',
        reportId: report._id,
      });
    }

    return report;
  }

  async getReportByTask(taskId, userId) {
    if (!mongoose.Types.ObjectId.isValid(taskId)) throw new Error('Report not found');
    const task = await taskRepository.findById(taskId);
    if (!task) throw new Error('Report not found');
    if (task.assignedBy.toString() !== userId) throw new Error('Unauthorized');

    const report = await reportRepository.findByTask(taskId);
    if (!report) throw new Error('Report not found');
    return report;
  }

  async getReportById(reportId, userId) {
    if (!mongoose.Types.ObjectId.isValid(reportId)) throw new Error('Report not found');
    const report = await reportRepository.findByIdWithTask(reportId);
    if (!report) throw new Error('Report not found');
    const ownerId = report.task?.assignedBy?._id?.toString() || report.task?.assignedBy?.toString();
    if (ownerId !== userId) throw new Error('Unauthorized');
    return report;
  }

  async getUserReports(userId) {
    return await reportRepository.findByUser(userId);
  }
}

export default new ReportService();
