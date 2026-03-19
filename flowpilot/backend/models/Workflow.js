const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  version: {
    type: Number,
    default: 1
  },
  is_active: {
    type: Boolean,
    default: true
  },
  input_schema: {
    type: Object,
    required: true,
    default: {}
  },
  start_step_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Step',
    default: null
  }
}, {
  timestamps: true
});

workflowSchema.index({ name: 1, version: -1 });

module.exports = mongoose.model('Workflow', workflowSchema);
