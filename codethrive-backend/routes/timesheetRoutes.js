const express = require('express');
const { logTimesheet, getMyTimesheet } = require('../controllers/timesheetController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', logTimesheet);
router.get('/my-timesheet', getMyTimesheet);

module.exports = router;
