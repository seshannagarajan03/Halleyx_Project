const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  step_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Step',
    required: true
  },
  condition: {
    type: String,
    default: ''
  },
  next_step_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Step',
    default: null
  },
  priority: {
    type: Number,
    required: true,
    default: 0
  },
  is_default: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for evaluation
ruleSchema.index({ step_id: 1, priority: 1 });

module.exports = mongoose.model('Rule', ruleSchema);
