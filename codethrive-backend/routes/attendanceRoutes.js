const express = require('express');
const { startWorkSession, startBreak, startLunch, resumeWork, checkout, getTodayAttendance, getAttendanceHistory, getAttendanceSummary, requestCorrection, getLeaveSummary, applyLeave } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../utils/upload');

const router = express.Router();

// Apply protection to all attendance routes
router.use(protect);

router.get('/today', getTodayAttendance);
router.post('/start-work', startWorkSession);
router.post('/start-break', startBreak);
router.post('/start-lunch', startLunch);
router.post('/resume-work', resumeWork);
router.post('/checkout', checkout);

router.get('/history', getAttendanceHistory);
router.get('/summary', getAttendanceSummary);
router.post('/correction', upload.single('attachment'), requestCorrection);
router.route('/leaves')
  .get(getLeaveSummary)
  .post(applyLeave);

module.exports = router;
