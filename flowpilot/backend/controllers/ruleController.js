const Rule = require('../models/Rule');
const ruleEngine = require('../engine/ruleEngine');

const validateRuleInput = (condition, isDefault) => {
  if (isDefault || String(condition).trim().toUpperCase() === 'DEFAULT') {
    return { isValid: true, normalizedCondition: 'DEFAULT', isDefault: true };
  }

  const validation = ruleEngine.validate(condition);
  return {
    ...validation,
    normalizedCondition: condition,
    isDefault: false
  };
};

exports.createRule = async (req, res, next) => {
  try {
    req.body.step_id = req.params.step_id;

    const validation = validateRuleInput(req.body.condition, req.body.is_default);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const rule = await Rule.create({
      ...req.body,
      condition: validation.normalizedCondition,
      is_default: validation.isDefault
    });
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

exports.getRules = async (req, res, next) => {
  try {
    const rules = await Rule.find({ step_id: req.params.step_id }).sort({ priority: 1 });
    res.status(200).json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
};

exports.updateRule = async (req, res, next) => {
  try {
    const validation = validateRuleInput(req.body.condition, req.body.is_default);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const rule = await Rule.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        condition: validation.normalizedCondition,
        is_default: validation.isDefault
      },
      { new: true, runValidators: true }
    );

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    res.status(200).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

exports.deleteRule = async (req, res, next) => {
  try {
    const rule = await Rule.findByIdAndDelete(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
