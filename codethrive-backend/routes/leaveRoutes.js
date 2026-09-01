const express = require('express');
const { getMyLeaves, applyLeave, getAllLeaves, updateLeaveStatus } = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Employee routes
router.get('/my-leaves', getMyLeaves);
router.post('/', applyLeave);

// Admin routes
router.get('/', authorize('superadmin', 'admin', 'hr'), getAllLeaves);
router.put('/:id', authorize('superadmin', 'admin', 'hr'), updateLeaveStatus);

module.exports = router;
