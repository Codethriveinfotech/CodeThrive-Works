const express = require('express');
const { submitReport, getMyReports, updateReport } = require('../controllers/dailyReportController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../utils/upload');

const router = express.Router();

router.use(protect);

router.post('/', upload.single('attachment'), submitReport);
router.get('/my-reports', getMyReports);
router.put('/:id', upload.single('attachment'), updateReport);

module.exports = router;
