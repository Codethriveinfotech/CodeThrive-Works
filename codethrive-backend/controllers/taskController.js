const Task = require('../models/Task');
const TaskActivity = require('../models/TaskActivity');
const Employee = require('../models/Employee');

// Helper for Audit Logging
const logActivity = async (taskId, userId, action, prev, next, comment = '') => {
  await TaskActivity.create({
    task: taskId,
    user: userId,
    action,
    previousValue: prev,
    newValue: next,
    comment
  });
};

// @desc    Admin/TeamLead creates and assigns a task
// @route   POST /api/v1/tasks
// @access  Private (Admin/HR/TeamLead)
exports.createTask = async (req, res) => {
  try {
    const count = await Task.countDocuments();
    const taskId = `TSK-${String(count + 101).padStart(3, '0')}`;
    
    const task = await Task.create({
      ...req.body,
      taskId,
      assignedBy: req.user._id
    });

    await logActivity(task._id, req.user._id, 'Task Created & Assigned', null, task.status);

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Employee updates task progress
// @route   PUT /api/v1/tasks/:id/progress
// @access  Private (Assigned Employee)
exports.updateTaskProgress = async (req, res) => {
  try {
    const { progressPercentage, status, comment, links } = req.body;
    let task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Ensure only assigned employee or admin can update
    const employee = await Employee.findOne({ user: req.user._id });
    if (task.assignedTo.toString() !== employee?._id.toString() && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
    }

    const prevProgress = task.progressPercentage;
    const prevStatus = task.status;

    if (progressPercentage !== undefined) task.progressPercentage = progressPercentage;
    if (status !== undefined) task.status = status;
    if (links) task.links = { ...task.links, ...links };

    await task.save();

    // Log the change
    if (prevProgress !== progressPercentage) {
      await logActivity(task._id, req.user._id, 'Progress Updated', `${prevProgress}%`, `${progressPercentage}%`, comment);
    }
    if (prevStatus !== status) {
      await logActivity(task._id, req.user._id, 'Status Changed', prevStatus, status, comment);
    }

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get Employee's Tasks
// @route   GET /api/v1/tasks/my-tasks
// @access  Private (Employee)
exports.getMyTasks = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(200).json({ success: true, count: 0, data: [] });
    
    const tasks = await Task.find({ assignedTo: employee._id }).sort('-createdAt');
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all tasks (Admin)
// @route   GET /api/v1/tasks
// @access  Private (Admin)
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find().populate('assignedTo', 'fullName employeeId').sort('-createdAt');
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update task details (Admin)
// @route   PUT /api/v1/tasks/:id
// @access  Private (Admin)
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete task (Admin)
// @route   DELETE /api/v1/tasks/:id
// @access  Private (Admin)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    await task.deleteOne();
    await TaskActivity.deleteMany({ task: req.params.id });
    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
