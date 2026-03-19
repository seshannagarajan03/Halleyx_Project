const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  workflow_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  step_type: {
    type: String,
    enum: ['task', 'approval', 'notification'],
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Index for lookups
stepSchema.index({ workflow_id: 1, order: 1 });

module.exports = mongoose.model('Step', stepSchema);
