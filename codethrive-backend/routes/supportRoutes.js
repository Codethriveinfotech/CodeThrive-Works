const express = require('express');
const { createTicket, getMyTickets } = require('../controllers/supportController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../utils/upload');

const router = express.Router();

router.use(protect);

router.post('/', upload.single('attachment'), createTicket);
router.get('/my-tickets', getMyTickets);

module.exports = router;
