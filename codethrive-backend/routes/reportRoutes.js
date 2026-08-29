const express = require('express');
const { getSummaryReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/summary', authorize('superadmin', 'admin', 'hr'), getSummaryReport);

module.exports = router;
