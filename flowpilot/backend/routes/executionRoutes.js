const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getExecutions, getExecution, cancelExecution, resumeExecution, retryExecution } = require('../controllers/executionController');

router.get('/', protect, getExecutions);
router.get('/:id', protect, getExecution);
router.post('/:id/cancel', protect, cancelExecution);
router.post('/:id/resume', protect, resumeExecution);
router.post('/:id/retry', protect, retryExecution);

module.exports = router;
