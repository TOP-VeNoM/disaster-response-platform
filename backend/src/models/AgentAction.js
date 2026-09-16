const mongoose = require('mongoose');

/**
 * A durable, append-only log of every step the agent orchestrator takes for a
 * given report. This is what powers the AgentTimeline component on the frontend
 * and gives you an audit trail for why the agent recommended what it did.
 */
const agentActionSchema = new mongoose.Schema(
  {
    report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
    step: {
      type: String,
      enum: ['parse', 'classify', 'retrieve_sops', 'call_tool', 'generate_plan', 'human_review'],
      required: true
    },
    status: {
      type: String,
      enum: ['started', 'completed', 'failed'],
      default: 'started'
    },
    input: mongoose.Schema.Types.Mixed,
    output: mongoose.Schema.Types.Mixed,
    error: String,
    durationMs: Number
  },
  { timestamps: true }
);

agentActionSchema.index({ report: 1, createdAt: 1 });

module.exports = mongoose.model('AgentAction', agentActionSchema);
