const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Task = require('../models/Task');
// const Meeting = require('../models/Meeting'); // We will create this next

// @desc    Get admin dashboard stats
// @route   GET /api/v1/dashboard/admin-stats
// @access  Private (Admin/HR)
exports.getDashboardStats = async (req, res) => {
  try {
    const employees = await Employee.find({ status: { $in: ['Approved', 'Active', 'Pending'] } }).populate('user', 'email role');
    const totalEmployees = employees.length;
    const pendingRegistrations = employees.filter(e => e.status === 'Pending').length;
    
    // Get today's attendance stats
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    const attendances = await Attendance.find({ date: { $gte: start, $lte: end } });
    const attendanceMap = new Map();
    attendances.forEach(att => {
      attendanceMap.set(att.employee.toString(), att);
    });

    // Fetch all active tasks
    const allTasks = await Task.find({}).sort({ createdAt: -1 });
    const tasksMap = new Map();
    allTasks.forEach(task => {
      if (task.assignedTo) {
        const empIdStr = task.assignedTo.toString();
        if (!tasksMap.has(empIdStr)) tasksMap.set(empIdStr, []);
        tasksMap.get(empIdStr).push(task);
      }
    });
    
    let working = 0;
    let onBreak = 0;
    let onLunch = 0;
    let checkedOut = 0;
    
    const liveMonitoring = employees.map(emp => {
      const att = attendanceMap.get(emp._id.toString());
      const empTasks = tasksMap.get(emp._id.toString()) || [];
      const currentStatus = att ? att.status : 'Not Checked In';

      if (currentStatus === 'Working') working++;
      else if (currentStatus === 'On Break') onBreak++;
      else if (currentStatus === 'On Lunch') onLunch++;
      else if (currentStatus === 'Checked Out') checkedOut++;

      const workSec = att?.totalWorkDurationInSeconds || 0;
      const breakSec = att?.totalBreakDurationInSeconds || 0;
      const lunchSec = att?.totalLunchDurationInSeconds || 0;

      return {
        _id: emp._id,
        id: emp.employeeId || `CTI-EMP-${emp._id.toString().slice(-4).toUpperCase()}`,
        name: emp.fullName,
        email: emp.email || emp.user?.email || 'N/A',
        dept: emp.department || 'General',
        designation: emp.designation || 'Software Engineer',
        joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'Recent',
        status: currentStatus,
        firstLoginTime: att?.firstLoginTime || null,
        lastLogoutTime: att?.lastLogoutTime || null,
        workSec,
        breakSec,
        lunchSec,
        duration: `${Math.floor(workSec / 3600)}h ${Math.floor((workSec % 3600) / 60)}m`,
        assignedTasksCount: empTasks.length,
        tasks: empTasks.map(t => ({
          _id: t._id,
          taskId: t.taskId || t._id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate
        }))
      };
    });
    
    const absent = totalEmployees - working - onBreak - onLunch - checkedOut;
    const pendingTaskReviews = await Task.countDocuments({ status: 'Ready for Review' });

    res.status(200).json({
      success: true,
      stats: {
        totalEmployees,
        working,
        onBreak,
        onLunch,
        checkedOut,
        absent: absent > 0 ? absent : 0,
        pendingRegistrations,
        pendingTaskReviews
      },
      liveMonitoring
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get employee dashboard stats (Today's Work)
// @route   GET /api/v1/dashboard/employee
// @access  Private
exports.getEmployeeDashboard = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    // 1. Attendance Status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: today, $lte: end }
    });

    let attStatus = 'Not Checked In';
    let activeSession = null;

    if (attendance) {
      attStatus = attendance.status;
      activeSession = await require('../models/AttendanceSession').findOne({
        attendanceId: attendance._id,
        sessionType: 'Work',
        status: 'Active'
      });
    }

    // 2. Tasks
    const activeTasks = await Task.find({ 
      assignedTo: employee._id,
      status: { $in: ['Assigned', 'Not Started', 'In Progress', 'Ready for Review', 'Changes Requested'] }
    }).sort({ priority: -1, dueDate: 1 });

    let pending = 0;
    let overdue = 0;
    const now = new Date();

    activeTasks.forEach(task => {
      if (task.status !== 'Completed') pending++;
      if (task.dueDate && new Date(task.dueDate) < now) overdue++;
    });

    // 3. Mock Meetings for now
    const meetings = [];

    res.status(200).json({
      success: true,
      data: {
        attendance: attendance || null,
        activeSession: activeSession || null,
        tasks: {
          today: activeTasks,
          pending,
          overdue
        },
        meetings
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
