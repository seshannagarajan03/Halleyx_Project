const Workflow = require('../models/Workflow');
const Step = require('../models/Step');
const Rule = require('../models/Rule');
const Execution = require('../models/Execution');
const ruleEngine = require('./ruleEngine');
const logger = require('../utils/logger');
const { validateInputAgainstSchema } = require('../utils/inputSchemaValidator');

class WorkflowEngine {
  constructor(io) {
    this.io = io;
    this.maxLoopIterations = 25;
  }

  resolveTemplate(value, context = {}) {
    if (typeof value !== 'string') {
      return value;
    }

    return value.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key) => {
      const keys = key.trim().split('.');
      let current = context;

      for (const k of keys) {
        if (current && Object.prototype.hasOwnProperty.call(current, k)) {
          current = current[k];
        } else {
          return '';
        }
      }

      return current ?? '';
    });
  }

  getNotificationRecipient(step, execution) {
    const metadata = step.metadata || {};
    const data = execution.data || {};

    return (
      this.resolveTemplate(metadata.assignee_email, data) ||
      this.resolveTemplate(metadata.recipient, data) ||
      data.assignee_email ||
      data.recipient ||
      data.email ||
      data.userEmail ||
      data.employeeEmail ||
      data.employee_email ||
      'unknown-recipient'
    );
  }

  getNotificationMessage(step, execution) {
    const metadata = step.metadata || {};
    const data = execution.data || {};

    return this.resolveTemplate(metadata.message, data) || 'Notification triggered';
  }

  async start(workflowId, inputData, userId) {
    const workflow = await Workflow.findById(workflowId);

    if (!workflow || !workflow.is_active) {
      throw new Error('Workflow not found or inactive');
    }

    const validation = validateInputAgainstSchema(inputData || {}, workflow.input_schema || {});
    if (!validation.isValid) {
      const error = new Error(validation.errors.join(', '));
      error.statusCode = 400;
      throw error;
    }

    const execution = new Execution({
      workflow_id: workflow._id,
      workflow_version: workflow.version,
      status: 'in_progress',
      data: inputData || {},
      current_step_id: workflow.start_step_id,
      triggered_by: userId || null,
      loop_guard: {}
    });

    await execution.save();
    this.emitStatus(execution);

    return this.processStep(execution);
  }

  async processStep(execution) {
    try {
      const step = await Step.findById(execution.current_step_id);

      if (!step) {
        return this.completeExecution(execution, 'failed', 'Current step not found');
      }

      const loopKey = String(step._id);
      execution.loop_guard = execution.loop_guard || {};
      execution.loop_guard[loopKey] = (execution.loop_guard[loopKey] || 0) + 1;

      if (execution.loop_guard[loopKey] > this.maxLoopIterations) {
        return this.completeExecution(execution, 'failed', 'Loop protection triggered: max iterations exceeded');
      }

      logger.info(`Processing step: ${step.name} (${step.step_type}) for execution ${execution._id}`);

      if (step.step_type === 'approval' && execution.status !== 'resuming') {
        execution.status = 'pending';
        execution.last_pending_step_id = step._id;
        await execution.save();
        this.emitStatus(execution);
        return execution;
      }

      if (execution.status === 'resuming') {
        execution.status = 'in_progress';
      }

      const startTime = new Date();

      if (step.step_type === 'notification') {
        const recipient = this.getNotificationRecipient(step, execution);
        const message = this.getNotificationMessage(step, execution);
        logger.info(`[NOTIFICATION] To: ${recipient}, Msg: ${message}`);
      }

      const rules = await Rule.find({ step_id: step._id }).sort({ priority: 1 });
      let nextStepId = null;
      const evaluatedRulesLog = [];
      let evaluationError = null;

      for (const rule of rules) {
        if (rule.is_default) continue;

        const validation = ruleEngine.validate(rule.condition);
        if (!validation.isValid) {
          evaluationError = validation.message;
          evaluatedRulesLog.push({
            rule_id: rule._id,
            condition: rule.condition,
            result: false,
            error_message: validation.message
          });
          continue;
        }

        const matches = ruleEngine.evaluate(rule.condition, execution.data || {});
        evaluatedRulesLog.push({
          rule_id: rule._id,
          condition: rule.condition,
          result: matches
        });

        if (matches) {
          nextStepId = rule.next_step_id;
          break;
        }
      }

      if (nextStepId === null) {
        const defaultRule = rules.find((r) => r.is_default);
        if (defaultRule) {
          nextStepId = defaultRule.next_step_id;
          evaluatedRulesLog.push({
            rule_id: defaultRule._id,
            condition: 'DEFAULT',
            result: true
          });
        }
      }

      execution.logs.push({
        step_id: step._id,
        step_name: step.name,
        step_type: step.step_type,
        evaluated_rules: evaluatedRulesLog,
        selected_next_step: nextStepId,
        status: evaluationError ? 'completed_with_fallback' : 'completed',
        approver_id: execution.status === 'resuming' ? execution.triggered_by : undefined,
        error_message: evaluationError,
        started_at: startTime,
        ended_at: new Date()
      });

      if (nextStepId) {
        execution.current_step_id = nextStepId;
        await execution.save();
        this.emitStatus(execution);

        return new Promise((resolve) => {
          setImmediate(async () => {
            resolve(await this.processStep(execution));
          });
        });
      }

      return this.completeExecution(execution, 'completed');
    } catch (error) {
      logger.error(`Workflow Engine Error: ${error.message}`, { executionId: execution?._id });
      return this.completeExecution(execution, 'failed', error.message);
    }
  }

  async completeExecution(execution, status, errorMessage = null) {
    execution.status = status;

    if (errorMessage) {
      const lastLog = execution.logs[execution.logs.length - 1];
      if (lastLog) {
        lastLog.error_message = errorMessage;
        lastLog.status = 'failed';
      }
    }

    if (status === 'completed' || status === 'failed' || status === 'canceled') {
      execution.ended_at = new Date();
    }

    await execution.save();
    this.emitStatus(execution);
    return execution;
  }

  async resume(executionId, actionData, userId) {
    const execution = await Execution.findById(executionId);

    if (!execution || execution.status !== 'pending') {
      throw new Error('Execution cannot be resumed');
    }

    execution.status = 'resuming';
    execution.triggered_by = userId || execution.triggered_by;
    execution.data = {
      ...(execution.data || {}),
      ...(actionData || {})
    };

    await execution.save();
    return this.processStep(execution);
  }

  async retry(executionId) {
    const execution = await Execution.findById(executionId);

    if (!execution || execution.status !== 'failed') {
      throw new Error('Only failed executions can be retried');
    }

    const failedLog = [...(execution.logs || [])].reverse().find((log) => log.status === 'failed' || log.error_message);
    if (!failedLog?.step_id) {
      throw new Error('No failed step found to retry');
    }

    execution.retries = (execution.retries || 0) + 1;
    execution.status = 'in_progress';
    execution.current_step_id = failedLog.step_id;
    await execution.save();

    return this.processStep(execution);
  }

  emitStatus(execution) {
    if (!this.io) return;

    this.io.emit('execution_update', {
      id: execution._id?.toString(),
      _id: execution._id?.toString(),
      status: execution.status,
      current_step_id: execution.current_step_id,
      logs: execution.logs,
      retries: execution.retries,
      updatedAt: execution.updatedAt
    });
  }
}

module.exports = WorkflowEngine;
