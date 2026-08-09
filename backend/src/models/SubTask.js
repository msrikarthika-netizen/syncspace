import mongoose from 'mongoose';

const subTaskSchema = new mongoose.Schema(
  {
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    agentType: {
      type: String,
      enum: ['research', 'coding', 'writing', 'analysis', 'general'],
      required: true,
    },
    agentName: { type: String },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed'],
      default: 'queued',
    },
    result: {
      type: String,
      default: '',
    },
    error: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
    durationMs: { type: Number },
    order: {
      type: Number,
      default: 0,
    },
    metadata: {
      tokensUsed: { type: Number },
      model: { type: String },
      promptTokens: { type: Number },
      completionTokens: { type: Number },
    },
  },
  { timestamps: true }
);

const SubTask = mongoose.model('SubTask', subTaskSchema);
export default SubTask;
