const express = require('express');
const { 
  submitReport, 
  getMyReports, 
  updateReport, 
  reviewReport, 
  getAllReports,
  downloadSrcFile
} = require('../controllers/dailyReportController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../utils/upload');

const router = express.Router();

router.use(protect);

router.post('/', upload.any(), submitReport);
router.get('/my-reports', getMyReports);
router.put('/:id', upload.any(), updateReport);
router.get('/:id/download-src', downloadSrcFile);

// Admin / Reviewer Routes
router.get('/', authorize('superadmin', 'admin', 'hr', 'teamlead'), getAllReports);
router.put('/:id/review', authorize('superadmin', 'admin', 'hr', 'teamlead'), reviewReport);
router.patch('/:id/status', authorize('superadmin', 'admin', 'hr', 'teamlead'), reviewReport);

module.exports = router;


