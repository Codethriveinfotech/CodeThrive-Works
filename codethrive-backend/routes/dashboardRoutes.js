const express = require('express');
const { getDashboardStats, getEmployeeDashboard } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', protect, authorize('superadmin', 'admin', 'hr'), getDashboardStats);
router.get('/employee', protect, getEmployeeDashboard);

module.exports = router;
