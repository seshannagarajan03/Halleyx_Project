const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getWorkflows, createWorkflow, getWorkflow, updateWorkflow, deleteWorkflow } = require('../controllers/workflowController');
const { getSteps, createStep } = require('../controllers/stepController');
const { getRules, createRule } = require('../controllers/ruleController');
const { executeWorkflow } = require('../controllers/executionController');

router.get('/', protect, getWorkflows);
router.post('/', protect, authorize('admin'), createWorkflow);
router.get('/:id', protect, getWorkflow);
router.put('/:id', protect, authorize('admin'), updateWorkflow);
router.delete('/:id', protect, authorize('admin'), deleteWorkflow);

router.get('/:workflow_id/steps', protect, getSteps);
router.post('/:workflow_id/steps', protect, authorize('admin'), createStep);
router.get('/steps/:step_id/rules', protect, getRules);
router.post('/steps/:step_id/rules', protect, authorize('admin'), createRule);
router.post('/:workflow_id/execute', protect, executeWorkflow);

module.exports = router;
