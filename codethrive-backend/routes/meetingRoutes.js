const express = require('express');
const { getMyMeetings, scheduleMeeting, updateMeeting } = require('../controllers/meetingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/my-meetings', getMyMeetings);
router.post('/', scheduleMeeting);
router.put('/:id', updateMeeting);

module.exports = router;
