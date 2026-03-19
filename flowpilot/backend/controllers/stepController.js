const Step = require('../models/Step');
const Rule = require('../models/Rule');
const Workflow = require('../models/Workflow');

exports.createStep = async (req, res, next) => {
  try {
    req.body.workflow_id = req.params.workflow_id;
    const step = await Step.create(req.body);

    const workflow = await Workflow.findById(req.params.workflow_id);
    if (workflow && !workflow.start_step_id) {
      workflow.start_step_id = step._id;
      await workflow.save();
    }

    res.status(201).json({ success: true, data: step });
  } catch (error) {
    next(error);
  }
};

exports.getSteps = async (req, res, next) => {
  try {
    const steps = await Step.find({ workflow_id: req.params.workflow_id }).sort({ order: 1 });
    res.status(200).json({ success: true, data: steps });
  } catch (error) {
    next(error);
  }
};

exports.updateStep = async (req, res, next) => {
  try {
    const step = await Step.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!step) {
      return res.status(404).json({ success: false, message: 'Step not found' });
    }
    res.status(200).json({ success: true, data: step });
  } catch (error) {
    next(error);
  }
};

exports.deleteStep = async (req, res, next) => {
  try {
    const step = await Step.findById(req.params.id);
    if (!step) {
      return res.status(404).json({ success: false, message: 'Step not found' });
    }

    await Step.findByIdAndDelete(req.params.id);
    await Rule.deleteMany({ step_id: req.params.id });

    const workflow = await Workflow.findById(step.workflow_id);
    if (workflow && String(workflow.start_step_id) === String(req.params.id)) {
      const nextStep = await Step.findOne({ workflow_id: workflow._id }).sort({ order: 1 });
      workflow.start_step_id = nextStep?._id || null;
      await workflow.save();
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
