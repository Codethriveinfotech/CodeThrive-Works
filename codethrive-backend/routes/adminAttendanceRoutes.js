const express = require('express');
const {
  getAttendanceRegister,
  markAttendance,
  bulkMarkAttendance,
  getMonthlyReport,
  getAttendanceCorrections,
  updateCorrectionStatus
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

// GET  /api/v1/admin/attendance/corrections
router.get('/corrections', getAttendanceCorrections);

// PUT  /api/v1/admin/attendance/corrections/:id/status
router.put('/corrections/:id/status', updateCorrectionStatus);

module.exports = router;
