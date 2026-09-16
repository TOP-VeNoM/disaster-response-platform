const mongoose = require('mongoose');

/**
 * Standard Operating Procedure documents. The `embedding` field holds a
 * 384-dim vector (from all-MiniLM-L6-v2 via @xenova/transformers) and must
 * match the Atlas Vector Search index defined in config/vectorSearch.js.
 */
const sopSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    disasterType: {
      type: String,
      enum: ['flood', 'fire', 'earthquake', 'storm', 'medical', 'other'],
      required: true
    },
    content: { type: String, required: true },
    steps: [String],
    embedding: {
      type: [Number],
      required: true,
      select: false // don't send 384 floats back on normal queries; opt in explicitly
    },
    source: { type: String, default: 'seed' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SOP', sopSchema);
