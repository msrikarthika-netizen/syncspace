import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Task description is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'queued', 'processing', 'in_progress', 'completed', 'failed'],
      default: 'pending',
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
    },
    deadline: { type: Date },
    tags: [{ type: String }],
    subtasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubTask',
      },
    ],
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
    },
    aiMetadata: {
      orchestratorModel: { type: String },
      totalAgentsUsed: { type: Number, default: 0 },
      processingStartedAt: { type: Date },
      processingCompletedAt: { type: Date },
      processingDurationMs: { type: Number },
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { timestamps: true }
);

const Task = mongoose.model('Task', taskSchema);
export default Task;
