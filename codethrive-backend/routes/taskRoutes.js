const express = require('express');
const { createTask, updateTaskProgress, getMyTasks } = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', authorize('superadmin', 'admin', 'teamlead'), createTask);
router.put('/:id/progress', updateTaskProgress);
router.get('/my-tasks', getMyTasks);

module.exports = router;
