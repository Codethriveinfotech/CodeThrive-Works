const express = require('express');
const { submitReport, getMyReports, updateReport, getAllReports } = require('../controllers/dailyReportController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../utils/upload');

const router = express.Router();

router.use(protect);

router.post('/', upload.single('attachment'), submitReport);
router.get('/my-reports', getMyReports);
router.put('/:id', upload.single('attachment'), updateReport);

// Admin Routes
router.get('/', authorize('superadmin', 'admin', 'hr', 'teamlead'), getAllReports);

module.exports = router;
