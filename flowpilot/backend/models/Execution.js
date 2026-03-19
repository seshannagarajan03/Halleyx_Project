const mongoose = require('mongoose');

const executionSchema = new mongoose.Schema(
  {
    workflow_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true
    },
    workflow_version: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resuming', 'completed', 'failed', 'canceled'],
      default: 'pending'
    },
    data: {
      type: Object,
      default: {}
    },
    current_step_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Step'
    },
    last_pending_step_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Step',
      default: null
    },
    loop_guard: {
      type: Object,
      default: {}
    },
    logs: [
      {
        step_id: mongoose.Schema.Types.ObjectId,
        step_name: String,
        step_type: String,
        evaluated_rules: [
          {
            rule_id: mongoose.Schema.Types.ObjectId,
            condition: String,
            result: Boolean,
            error_message: String
          }
        ],
        selected_next_step: mongoose.Schema.Types.ObjectId,
        status: String,
        approver_id: mongoose.Schema.Types.ObjectId,
        error_message: String,
        started_at: Date,
        ended_at: Date
      }
    ],
    retries: {
      type: Number,
      default: 0
    },
    triggered_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    ended_at: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

executionSchema.index({ workflow_id: 1, status: 1 });
executionSchema.index({ triggered_by: 1 });

module.exports = mongoose.model('Execution', executionSchema);
