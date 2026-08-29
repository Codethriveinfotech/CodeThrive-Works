const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Task = require('../models/Task');
// const Meeting = require('../models/Meeting'); // We will create this next

// @desc    Get admin dashboard stats
// @route   GET /api/v1/dashboard/admin-stats
// @access  Private (Admin/HR)
exports.getDashboardStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments({ status: { $in: ['Approved', 'Active'] } });
    const pendingRegistrations = await Employee.countDocuments({ status: 'Pending' });
    
    // Get today's attendance stats
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    const attendances = await Attendance.find({ date: { $gte: start, $lte: end } }).populate('employee');
    
    let working = 0;
    let onBreak = 0;
    
    const liveMonitoring = [];
    
    attendances.forEach(att => {
      if (att.status === 'Working') working++;
      if (att.status === 'On Break') onBreak++;
      
      if (att.employee) {
        liveMonitoring.push({
          id: att.employee.employeeId || 'New',
          name: att.employee.fullName,
          dept: att.employee.department || 'Not Assigned',
          status: att.status,
          task: '-', // Task integration placeholder
          duration: `${Math.floor((att.totalWorkDurationInSeconds || 0) / 3600)}h ${Math.floor(((att.totalWorkDurationInSeconds || 0) % 3600) / 60)}m`
        });
      }
    });
    
    const absent = totalEmployees - working - onBreak - attendances.filter(a => a.status === 'Checked Out').length;

    // Get Pending Task Reviews (Mock query for now until task reviews are implemented)
    const pendingTaskReviews = await Task.countDocuments({ status: 'Ready for Review' });

    res.status(200).json({
      success: true,
      stats: {
        totalEmployees,
        working,
        onBreak,
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

    let currentWorkingDuration = 0;
    let breakDuration = 0; // Requires deeper session tracking, mocking break for now
    let attStatus = 'Not Checked In';

    if (attendance) {
      attStatus = attendance.status;
      if (attendance.firstLoginTime && attStatus === 'Working') {
        currentWorkingDuration = Math.floor((Date.now() - attendance.firstLoginTime.getTime()) / 1000);
      }
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
        attendance: {
          status: attStatus,
          loginTime: attendance ? attendance.firstLoginTime : null,
          currentWorkingDuration,
          breakDuration
        },
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
