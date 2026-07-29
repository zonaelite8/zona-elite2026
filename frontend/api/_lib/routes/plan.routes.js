const express = require('express');
const router = express.Router();
const { getAllPlans, createPlan, updatePlan, deletePlan } = require('../controllers/plan.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Getting plans should be public for the registration form
router.get('/', getAllPlans);
router.post('/', authenticateToken, isAdmin, createPlan);
router.put('/:id', authenticateToken, isAdmin, updatePlan);
router.delete('/:id', authenticateToken, isAdmin, deletePlan);

module.exports = router;
