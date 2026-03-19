const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { updateStep, deleteStep } = require('../controllers/stepController');
const { getRules, createRule } = require('../controllers/ruleController');

router.put('/:id', protect, authorize('admin'), updateStep);
router.delete('/:id', protect, authorize('admin'), deleteStep);
router.get('/:step_id/rules', protect, getRules);
router.post('/:step_id/rules', protect, authorize('admin'), createRule);

module.exports = router;
