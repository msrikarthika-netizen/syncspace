import CrudRepository from './crudRepository.js';
import Task from '../models/Task.js';

class TaskRepository extends CrudRepository {
  constructor() {
    super(Task);
  }

  async findByUser(userId, filter = {}) {
    return await Task.find({ assignedBy: userId, ...filter })
      .populate('assignedBy', 'username avatar email')
      .populate('subtasks')
      .populate('report')
      .sort({ createdAt: -1 });
  }

  async findWithSubtasks(taskId) {
    return await Task.findById(taskId)
      .populate('assignedBy', 'username avatar email')
      .populate({
        path: 'subtasks',
        options: { sort: { order: 1 } },
      })
      .populate('report');
  }

  async updateProgress(taskId, progress, status) {
    return await Task.findByIdAndUpdate(
      taskId,
      { progress, status },
      { returnDocument: 'after' }
    );
  }

  async getStats(userId) {
    const stats = await Task.aggregate([
      { $match: { assignedBy: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    return stats;
  }
}

export default new TaskRepository();
