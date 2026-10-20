const express = require('express');
const {
  getAttendanceRegister,
  markAttendance,
  bulkMarkAttendance,
  getMonthlyReport,
} = require('../controllers/adminAttendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require login + admin/hr role
router.use(protect);
router.use(authorize('superadmin', 'admin', 'hr'));

// GET  /api/v1/admin/attendance/register?date=YYYY-MM-DD
router.get('/register', getAttendanceRegister);

// POST /api/v1/admin/attendance/mark
router.post('/mark', markAttendance);

// POST /api/v1/admin/attendance/bulk-mark
router.post('/bulk-mark', bulkMarkAttendance);

// GET  /api/v1/admin/attendance/monthly?month=M&year=YYYY&employeeId=optional
router.get('/monthly', getMonthlyReport);

module.exports = router;
