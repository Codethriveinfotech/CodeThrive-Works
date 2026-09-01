const express = require('express');
const { createTask, updateTaskProgress, getMyTasks, getAllTasks, updateTask, deleteTask } = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', authorize('superadmin', 'admin', 'hr', 'teamlead'), createTask);
router.put('/:id/progress', updateTaskProgress);
router.get('/my-tasks', getMyTasks);

// Admin Routes
router.get('/', authorize('superadmin', 'admin', 'hr'), getAllTasks);
router.put('/:id', authorize('superadmin', 'admin', 'hr'), updateTask);
router.delete('/:id', authorize('superadmin', 'admin', 'hr'), deleteTask);

module.exports = router;
