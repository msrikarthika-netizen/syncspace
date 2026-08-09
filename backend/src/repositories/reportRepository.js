import CrudRepository from './crudRepository.js';
import Report from '../models/Report.js';

class ReportRepository extends CrudRepository {
  constructor() {
    super(Report);
  }

  async findByTask(taskId) {
    return await Report.findOne({ task: taskId })
      .populate('task', 'title description priority assignedBy')
      .populate('generatedBy', 'username avatar');
  }

  async upsertForTask(taskId, data) {
    return await Report.findOneAndUpdate(
      { task: taskId },
      { $set: data },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );
  }

  async findByIdWithTask(reportId) {
    return await Report.findById(reportId)
      .populate('task', 'title description priority status assignedBy')
      .populate('generatedBy', 'username avatar');
  }

  async findByUser(userId) {
    return await Report.find({ generatedBy: userId })
      .populate('task', 'title status priority')
      .sort({ createdAt: -1 });
  }
}

export default new ReportRepository();
