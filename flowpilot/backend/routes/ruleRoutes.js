const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { updateRule, deleteRule } = require('../controllers/ruleController');

router.put('/:id', protect, authorize('admin'), updateRule);
router.delete('/:id', protect, authorize('admin'), deleteRule);

module.exports = router;
