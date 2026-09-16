const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true, trim: true },
    disasterType: {
      type: String,
      enum: ['flood', 'fire', 'earthquake', 'storm', 'medical', 'other'],
      default: 'other'
    },
    location: {
      address: { type: String, trim: true },
      lat: Number,
      lng: Number
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: null // set by the agent's Classifier, null until classified
    },
    status: {
      type: String,
      enum: ['submitted', 'processing', 'awaiting_review', 'approved', 'rejected', 'resolved'],
      default: 'submitted'
    },
    // Populated by AgentOrchestrator as it moves through its pipeline
    agentRun: {
      classification: {
        urgency: String,
        confidence: Number,
        reasoning: String
      },
      retrievedSOPs: [
        {
          sopId: { type: mongoose.Schema.Types.ObjectId, ref: 'SOP' },
          title: String,
          score: Number
        }
      ],
      toolResults: [
        {
          tool: String,
          input: mongoose.Schema.Types.Mixed,
          output: mongoose.Schema.Types.Mixed,
          error: String
        }
      ],
      plan: {
        summary: String,
        steps: [String],
        recommendedResources: [String]
      }
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewNotes: { type: String, default: '' },
    // The AI's original output lives permanently at agentRun.plan and is
    // never overwritten. If a responder edits the plan before approving,
    // their version goes here instead — so there's always an audit trail
    // of what the AI actually recommended vs. what a human changed it to.
    // Null until a responder makes an edit; the UI/approve flow falls back
    // to agentRun.plan whenever this is null.
    editedPlan: {
      summary: String,
      steps: [String],
      recommendedResources: [String],
      editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      editedAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

reportSchema.index({ disasterType: 1, status: 1 });
reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
