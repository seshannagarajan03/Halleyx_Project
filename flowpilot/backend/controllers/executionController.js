const mongoose = require('mongoose');
const Execution = require('../models/Execution');

let engine;

exports.setEngine = (e) => {
  engine = e;
};

exports.getExecutions = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const status = (req.query.status || '').trim();
    const query = status ? { status } : {};

    const executions = await Execution.find(query)
      .populate('workflow_id', 'name version')
      .populate('triggered_by', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit) 
      .skip((page - 1) * limit);

    const count = await Execution.countDocuments(query);

    res.status(200).json({
      success: true,
      data: executions,
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

exports.executeWorkflow = async (req, res, next) => {
  try {
    const execution = await engine.start(
      req.params.workflow_id,
      req.body,
      req.user?.id
    );

    res.status(200).json({
      success: true,
      data: execution
    });
  } catch (error) {
    next(error);
  }
};

exports.getExecution = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id === 'null' || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid execution id'
      });
    }

    const execution = await Execution.findById(id)
      .populate('workflow_id', 'name version is_active')
      .populate('current_step_id', 'name step_type')
      .populate('triggered_by', 'name email');

    if (!execution) {
      return res.status(404).json({
        success: false,
        message: 'Execution not found'
      });
    }

    res.status(200).json({
      success: true,
      data: execution
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelExecution = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id === 'null' || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid execution id'
      });
    }

    const execution = await Execution.findById(id);
    if (!execution) {
      return res.status(404).json({
        success: false,
        message: 'Execution not found'
      });
    }

    if (['completed', 'failed', 'canceled'].includes(execution.status)) {
      return res.status(400).json({
        success: false,
        message: `Execution already ended with status ${execution.status}`
      });
    }

    execution.status = 'canceled';
    execution.ended_at = new Date();
    await execution.save();
    engine?.emitStatus?.(execution);

    res.status(200).json({
      success: true,
      data: execution
    });
  } catch (error) {
    next(error);
  }
};

exports.resumeExecution = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id === 'null' || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid execution id'
      });
    }

    const execution = await engine.resume(id, req.body || {}, req.user?.id);

    res.status(200).json({
      success: true,
      data: execution
    });
  } catch (error) {
    next(error);
  }
};

exports.retryExecution = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id === 'null' || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid execution id'
      });
    }

    const execution = await engine.retry(id, req.user?.id);

    res.status(200).json({
      success: true,
      data: execution
    });
  } catch (error) {
    next(error);
  }
};
