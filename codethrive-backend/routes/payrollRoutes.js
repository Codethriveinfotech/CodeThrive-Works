const express = require('express');
const { getMyPayslips, getAllPayroll, createIndividualPayroll, bulkGeneratePayroll } = require('../controllers/payrollController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/my-payslips', getMyPayslips);
router.get('/', authorize('superadmin', 'admin', 'hr'), getAllPayroll);
router.post('/', authorize('superadmin', 'admin', 'hr'), createIndividualPayroll);
router.post('/bulk-generate', authorize('superadmin', 'admin', 'hr'), bulkGeneratePayroll);

module.exports = router;
