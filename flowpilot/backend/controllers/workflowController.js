const mongoose = require('mongoose');
const Workflow = require('../models/Workflow');
const Step = require('../models/Step');
const Rule = require('../models/Rule');
const Execution = require('../models/Execution');

const buildWorkflowQuery = ({ search = '', status = 'all' }) => {
  const query = {};

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  if (status === 'active') query.is_active = true;
  if (status === 'inactive') query.is_active = false;

  return query;
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

// @desc    Get all workflows
// @route   GET /api/workflows
// @access  Private
exports.getWorkflows = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const search = (req.query.search || '').trim();
    const status = (req.query.status || 'all').trim();
    const query = buildWorkflowQuery({ search, status });

    const workflows = await Workflow.find(query)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ updatedAt: -1 });

    const workflowIds = workflows.map((workflow) => workflow._id);

    const steps = workflowIds.length
      ? await Step.find({ workflow_id: { $in: workflowIds } }).select('workflow_id')
      : [];

    const stepsCountByWorkflow = steps.reduce((acc, step) => {
      const key = String(step.workflow_id);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const enrichedWorkflows = workflows.map((workflow) => ({
      ...workflow.toObject(),
      steps_count: stepsCountByWorkflow[String(workflow._id)] || 0
    }));

    const count = await Workflow.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: enrichedWorkflows,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: page,
        pageSize: limit
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create workflow
// @route   POST /api/workflows
// @access  Private/Admin
exports.createWorkflow = async (req, res, next) => {
  try {
    const {
      name,
      input_schema,
      is_active = true,
      start_step_id = null,
      description = ''
    } = req.body || {};

    if (!name || !input_schema) {
      return res.status(400).json({
        success: false,
        message: 'Workflow name and input_schema are required'
      });
    }

    if (start_step_id && !isValidObjectId(start_step_id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start_step_id'
      });
    }

    const workflow = await Workflow.create({
      name,
      input_schema,
      is_active,
      start_step_id,
      description,
      version: 1
    });

    return res.status(201).json({
      success: true,
      data: workflow
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single workflow with steps and rules
// @route   GET /api/workflows/:id
// @access  Private
exports.getWorkflow = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workflow id'
      });
    }

    const workflow = await Workflow.findById(req.params.id).lean();

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    const steps = await Step.find({ workflow_id: workflow._id })
      .sort({ order: 1 })
      .lean();

    const stepIds = steps.map((step) => step._id);

    const rules = stepIds.length
      ? await Rule.find({ step_id: { $in: stepIds } })
          .sort({ priority: 1 })
          .lean()
      : [];

    const rulesByStep = rules.reduce((acc, rule) => {
      const key = String(rule.step_id);
      acc[key] = acc[key] || [];
      acc[key].push(rule);
      return acc;
    }, {});

    const stepsWithRules = steps.map((step) => ({
      ...step,
      rules: rulesByStep[String(step._id)] || []
    }));

    return res.status(200).json({
      success: true,
      data: {
        ...workflow,
        steps: stepsWithRules
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update workflow by creating a new version
// @route   PUT /api/workflows/:id
// @access  Private/Admin
exports.updateWorkflow = async (req, res, next) => {
  try {
    const workflowId = req.params.id;

    if (!isValidObjectId(workflowId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workflow id'
      });
    }

    const existingWorkflow = await Workflow.findById(workflowId);

    if (!existingWorkflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    const existingSteps = await Step.find({ workflow_id: existingWorkflow._id })
      .sort({ order: 1 })
      .lean();

    const existingStepIds = existingSteps.map((step) => step._id);

    const existingRules = existingStepIds.length
      ? await Rule.find({ step_id: { $in: existingStepIds } })
          .sort({ priority: 1 })
          .lean()
      : [];

    // deactivate old version
    existingWorkflow.is_active = false;
    await existingWorkflow.save();

    // create new workflow version
    const newWorkflow = await Workflow.create({
      name: req.body.name ?? existingWorkflow.name,
      input_schema: req.body.input_schema ?? existingWorkflow.input_schema,
      is_active: req.body.is_active ?? true,
      version: (existingWorkflow.version || 1) + 1,
      description: req.body.description ?? existingWorkflow.description ?? '',
      start_step_id: null
    });

    const stepIdMap = new Map();

    // clone steps
    for (const step of existingSteps) {
      const clonedStep = await Step.create({
        workflow_id: newWorkflow._id,
        name: step.name,
        step_type: step.step_type,
        order: step.order,
        metadata: step.metadata || {}
      });

      stepIdMap.set(String(step._id), clonedStep._id);
    }

    // clone rules
    for (const rule of existingRules) {
      const mappedStepId = stepIdMap.get(String(rule.step_id));
      const mappedNextStepId = rule.next_step_id
        ? stepIdMap.get(String(rule.next_step_id)) || null
        : null;

      if (mappedStepId) {
        await Rule.create({
          step_id: mappedStepId,
          condition: rule.condition,
          next_step_id: mappedNextStepId,
          priority: rule.priority,
          is_default: rule.is_default
        });
      }
    }

    // set start step
    const incomingStartStepId = req.body.start_step_id;

    if (incomingStartStepId && stepIdMap.has(String(incomingStartStepId))) {
      newWorkflow.start_step_id = stepIdMap.get(String(incomingStartStepId));
    } else if (
      existingWorkflow.start_step_id &&
      stepIdMap.has(String(existingWorkflow.start_step_id))
    ) {
      newWorkflow.start_step_id = stepIdMap.get(String(existingWorkflow.start_step_id));
    } else {
      const firstClonedStep = await Step.findOne({ workflow_id: newWorkflow._id }).sort({
        order: 1
      });
      newWorkflow.start_step_id = firstClonedStep ? firstClonedStep._id : null;
    }

    await newWorkflow.save();

    return res.status(200).json({
      success: true,
      message: 'Workflow updated as a new version',
      data: newWorkflow
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete workflow
// @route   DELETE /api/workflows/:id
// @access  Private/Admin
exports.deleteWorkflow = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workflow id'
      });
    }

    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    const existingExecutions = await Execution.countDocuments({
      workflow_id: workflow._id
    });

    if (existingExecutions > 0) {
      return res.status(400).json({
        success: false,
        message:
          'Cannot delete a workflow that already has execution history. Deactivate it or create a new version instead.'
      });
    }

    const steps = await Step.find({ workflow_id: workflow._id }).select('_id');
    const stepIds = steps.map((step) => step._id);

    if (stepIds.length) {
      await Rule.deleteMany({ step_id: { $in: stepIds } });
    }

    await Step.deleteMany({ workflow_id: workflow._id });
    await Workflow.findByIdAndDelete(workflow._id);

    return res.status(200).json({
      success: true,
      message: 'Workflow deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Execute workflow
// @route   POST /api/workflows/:workflow_id/execute
// @access  Private
exports.executeWorkflow = async (req, res, next) => {
  try {
    const workflowId = req.params.workflow_id;

    if (!isValidObjectId(workflowId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workflow id'
      });
    }

    const workflow = await Workflow.findById(workflowId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    if (!workflow.start_step_id) {
      return res.status(400).json({
        success: false,
        message: 'Workflow has no start step configured'
      });
    }

    const workflowEngineModule = require('../services/workflowEngine');
    const engine = req.app.get('workflowEngine') || workflowEngineModule;

    const execution = await engine.start(
      workflowId,
      req.body,
      req.user?._id || req.user || null
    );

    return res.status(201).json({
      success: true,
      data: execution
    });
  } catch (error) {
    next(error);
  }
};