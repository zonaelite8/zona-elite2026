const express = require('express');
const router = express.Router();
const { getAllPlans, createPlan, updatePlan, deletePlan } = require('../controllers/plan.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// All endpoints should at least require authentication
// Creating, updating, deleting plans requires admin privileges
router.get('/', authenticateToken, getAllPlans);
router.post('/', authenticateToken, isAdmin, createPlan);
router.put('/:id', authenticateToken, isAdmin, updatePlan);
router.delete('/:id', authenticateToken, isAdmin, deletePlan);

module.exports = router;
