import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    sections: [
      {
        agentType: { type: String },
        agentName: { type: String },
        heading: { type: String },
        content: { type: String },
        order: { type: Number },
      },
    ],
    fullContent: { type: String },
    stats: {
      totalSubtasks: { type: Number, default: 0 },
      completedSubtasks: { type: Number, default: 0 },
      failedSubtasks: { type: Number, default: 0 },
      totalDurationMs: { type: Number },
      agentsUsed: [{ type: String }],
    },
    status: {
      type: String,
      enum: ['generating', 'ready', 'failed'],
      default: 'generating',
    },
    viewedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Report = mongoose.model('Report', reportSchema);
export default Report;
