const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');
const Employee = require('../models/Employee');
const AttendanceCorrection = require('../models/AttendanceCorrection');
const LeaveRequest = require('../models/LeaveRequest');

// Helper to get today's start and end date for queries
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// Helper to get or create an Employee linked to the user
const getOrCreateEmployee = async (user) => {
  if (!user) return null;
  let employee = await Employee.findOne({ user: user._id });
  if (!employee && user.email) {
    employee = await Employee.findOne({ companyEmailAddress: user.email });
    if (employee && !employee.user) {
      employee.user = user._id;
      await employee.save();
    }
  }
  if (!employee) {
    employee = await Employee.create({
      user: user._id,
      fullName: user.fullName || user.email?.split('@')[0] || 'CodeThrive User',
      companyEmailAddress: user.email || 'user@codethrive.com',
      employeeId: user.employeeId || `CTI-${Date.now().toString().slice(-4)}`,
      department: 'Software Engineering',
      jobTitle: user.designation || 'Software Engineer'
    });
  }
  return employee;
};

// @desc    Get today's attendance & active session
// @route   GET /api/v1/attendance/today
exports.getTodayAttendance = async (req, res) => {
  try {
    const employee = await getOrCreateEmployee(req.user);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    
    const { start, end } = getTodayRange();
    let attendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: start, $lte: end }
    });

    let activeSession = null;
    if (attendance) {
      activeSession = await AttendanceSession.findOne({
        attendanceId: attendance._id,
        status: 'Active'
      });
    }

    res.status(200).json({ success: true, data: { attendance, activeSession } });
  } catch (err) {
    console.error('Error in getTodayAttendance:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Start work session (Check-in)
// @route   POST /api/v1/attendance/start-work
// @access  Private (Employee)
exports.startWorkSession = async (req, res) => {
  try {
    const employee = await getOrCreateEmployee(req.user);
    const { start, end } = getTodayRange();

    // 1. Check if daily attendance exists
    let attendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: start, $lte: end }
    });

    const now = new Date();

    if (!attendance) {
      attendance = await Attendance.create({
        employee: employee._id,
        date: now,
        firstLoginTime: now,
        status: 'Working'
      });
    } else {
      attendance.status = 'Working';
      if (!attendance.firstLoginTime) {
        attendance.firstLoginTime = now;
      }
      await attendance.save();
    }

    // 2. Close any non-work active session if present (Break/Lunch)
    const existingBreakLunch = await AttendanceSession.findOne({
      attendanceId: attendance._id,
      sessionType: { $in: ['Break', 'Lunch'] },
      status: 'Active'
    });

    if (existingBreakLunch) {
      existingBreakLunch.endTime = now;
      existingBreakLunch.durationInSeconds = Math.floor((now.getTime() - existingBreakLunch.startTime.getTime()) / 1000);
      existingBreakLunch.status = 'Completed';
      await existingBreakLunch.save();

      if (existingBreakLunch.sessionType === 'Break') {
        attendance.totalBreakDurationInSeconds = (attendance.totalBreakDurationInSeconds || 0) + existingBreakLunch.durationInSeconds;
      } else {
        attendance.totalLunchDurationInSeconds = (attendance.totalLunchDurationInSeconds || 0) + existingBreakLunch.durationInSeconds;
      }
      await attendance.save();
    }

    // 3. Check for existing active Work session
    let workSession = await AttendanceSession.findOne({
      attendanceId: attendance._id,
      sessionType: 'Work',
      status: 'Active'
    });

    if (!workSession) {
      workSession = await AttendanceSession.create({
        attendanceId: attendance._id,
        employee: employee._id,
        sessionType: 'Work',
        startTime: now
      });
    }

    res.status(200).json({ success: true, message: 'Work session started', data: { attendance, activeSession: workSession } });
  } catch (err) {
    console.error('Error in startWorkSession:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Start Break (Pauses work session)
// @route   POST /api/v1/attendance/start-break
// @access  Private
exports.startBreak = async (req, res) => {
  try {
    const employee = await getOrCreateEmployee(req.user);
    const { start, end } = getTodayRange();
    const now = new Date();

    let attendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: start, $lte: end }
    });

    if (!attendance) {
      attendance = await Attendance.create({
        employee: employee._id,
        date: now,
        firstLoginTime: now,
        status: 'On Break'
      });
    }

    // Close active work session if any
    const activeWork = await AttendanceSession.findOne({
      attendanceId: attendance._id,
      sessionType: 'Work',
      status: 'Active'
    });

    if (activeWork) {
      activeWork.endTime = now;
      activeWork.durationInSeconds = Math.floor((now.getTime() - activeWork.startTime.getTime()) / 1000);
      activeWork.status = 'Completed';
      await activeWork.save();

      attendance.totalWorkDurationInSeconds = (attendance.totalWorkDurationInSeconds || 0) + activeWork.durationInSeconds;
    }

    // Start Break Session
    const breakSession = await AttendanceSession.create({
      attendanceId: attendance._id,
      employee: employee._id,
      sessionType: 'Break',
      startTime: now
    });

    attendance.status = 'On Break';
    await attendance.save();

    res.status(200).json({ success: true, message: 'Break started', data: { attendance, activeSession: breakSession } });
  } catch (err) {
    console.error('Error in startBreak:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Start Lunch (Pauses work session)
// @route   POST /api/v1/attendance/start-lunch
// @access  Private
exports.startLunch = async (req, res) => {
  try {
    const employee = await getOrCreateEmployee(req.user);
    const { start, end } = getTodayRange();
    const now = new Date();

    let attendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: start, $lte: end }
    });

    if (!attendance) {
      attendance = await Attendance.create({
        employee: employee._id,
        date: now,
        firstLoginTime: now,
        status: 'On Lunch'
      });
    }

    // Close active work session if any
    const activeWork = await AttendanceSession.findOne({
      attendanceId: attendance._id,
      sessionType: 'Work',
      status: 'Active'
    });

    if (activeWork) {
      activeWork.endTime = now;
      activeWork.durationInSeconds = Math.floor((now.getTime() - activeWork.startTime.getTime()) / 1000);
      activeWork.status = 'Completed';
      await activeWork.save();

      attendance.totalWorkDurationInSeconds = (attendance.totalWorkDurationInSeconds || 0) + activeWork.durationInSeconds;
    }

    // Start Lunch Session
    const lunchSession = await AttendanceSession.create({
      attendanceId: attendance._id,
      employee: employee._id,
      sessionType: 'Lunch',
      startTime: now
    });

    attendance.status = 'On Lunch';
    await attendance.save();

    res.status(200).json({ success: true, message: 'Lunch started', data: { attendance, activeSession: lunchSession } });
  } catch (err) {
    console.error('Error in startLunch:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Resume Work (Ends break or lunch session and starts work session)
// @route   POST /api/v1/attendance/resume-work
// @access  Private
exports.resumeWork = async (req, res) => {
  try {
    const employee = await getOrCreateEmployee(req.user);
    const { start, end } = getTodayRange();
    const now = new Date();

    let attendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: start, $lte: end }
    });

    if (!attendance) {
      attendance = await Attendance.create({
        employee: employee._id,
        date: now,
        firstLoginTime: now,
        status: 'Working'
      });
    }

    // Close active Break or Lunch session
    const activeSession = await AttendanceSession.findOne({
      attendanceId: attendance._id,
      status: 'Active'
    });

    if (activeSession) {
      activeSession.endTime = now;
      activeSession.durationInSeconds = Math.floor((now.getTime() - activeSession.startTime.getTime()) / 1000);
      activeSession.status = 'Completed';
      await activeSession.save();

      if (activeSession.sessionType === 'Break') {
        attendance.totalBreakDurationInSeconds = (attendance.totalBreakDurationInSeconds || 0) + activeSession.durationInSeconds;
      } else if (activeSession.sessionType === 'Lunch') {
        attendance.totalLunchDurationInSeconds = (attendance.totalLunchDurationInSeconds || 0) + activeSession.durationInSeconds;
      } else if (activeSession.sessionType === 'Work') {
        attendance.totalWorkDurationInSeconds = (attendance.totalWorkDurationInSeconds || 0) + activeSession.durationInSeconds;
      }
    }

    // Start new Work Session
    const workSession = await AttendanceSession.create({
      attendanceId: attendance._id,
      employee: employee._id,
      sessionType: 'Work',
      startTime: now
    });

    attendance.status = 'Working';
    await attendance.save();

    res.status(200).json({ success: true, message: 'Work resumed', data: { attendance, activeSession: workSession } });
  } catch (err) {
    console.error('Error in resumeWork:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Check out (End day / Logout)
// @route   POST /api/v1/attendance/checkout
// @access  Private
exports.checkout = async (req, res) => {
  try {
    const employee = await getOrCreateEmployee(req.user);
    const { start, end } = getTodayRange();
    const now = new Date();

    let attendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: start, $lte: end }
    });

    if (!attendance) {
      attendance = await Attendance.create({
        employee: employee._id,
        date: now,
        firstLoginTime: now,
        lastLogoutTime: now,
        status: 'Checked Out'
      });
    } else {
      // Close any active session (Work, Break, or Lunch)
      const activeSession = await AttendanceSession.findOne({
        attendanceId: attendance._id,
        status: 'Active'
      });

      if (activeSession) {
        activeSession.endTime = now;
        activeSession.durationInSeconds = Math.floor((now.getTime() - activeSession.startTime.getTime()) / 1000);
        activeSession.status = 'Completed';
        await activeSession.save();

        if (activeSession.sessionType === 'Work') {
          attendance.totalWorkDurationInSeconds = (attendance.totalWorkDurationInSeconds || 0) + activeSession.durationInSeconds;
        } else if (activeSession.sessionType === 'Break') {
          attendance.totalBreakDurationInSeconds = (attendance.totalBreakDurationInSeconds || 0) + activeSession.durationInSeconds;
        } else if (activeSession.sessionType === 'Lunch') {
          attendance.totalLunchDurationInSeconds = (attendance.totalLunchDurationInSeconds || 0) + activeSession.durationInSeconds;
        }
      }

      attendance.lastLogoutTime = now;
      attendance.status = 'Checked Out';
      await attendance.save();
    }

    res.status(200).json({ success: true, message: 'Successfully checked out for the day', data: { attendance, activeSession: null } });
  } catch (err) {
    console.error('Error in checkout:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get attendance history with filters (RBAC applied)
// @route   GET /api/v1/attendance/history
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { month, year, startDate, endDate, employeeId } = req.query;
    
    let query = {};

    if (employeeId) {
      query.employee = employeeId;
    } else if (req.user.role === 'employee') {
      const emp = await getOrCreateEmployee(req.user);
      query.employee = emp._id;
    } else if (req.user.role === 'teamlead') {
      const emp = await getOrCreateEmployee(req.user);
      const teamEmps = await Employee.find({ reportsTo: emp._id }).select('_id');
      query.employee = { $in: [...teamEmps.map(e => e._id), emp._id] };
    }

    if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      const startOfMonth = new Date(y, m - 1, 1);
      const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);
      query.date = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const history = await Attendance.find(query)
      .populate('employee', 'fullName employeeId department jobTitle profilePicture')
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: history.length, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get Monthly Attendance Summary Metrics
// @route   GET /api/v1/attendance/summary
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;
    let targetEmployeeId = employeeId;

    if (!targetEmployeeId) {
      const emp = await getOrCreateEmployee(req.user);
      targetEmployeeId = emp._id;
    }

    const m = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    const y = year ? parseInt(year, 10) : new Date().getFullYear();

    const startOfMonth = new Date(y, m - 1, 1);
    const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);

    const records = await Attendance.find({
      employee: targetEmployeeId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    let totalWorkingDays = 22;
    let presentDays = 0;
    let absentDays = 0;
    let leaveDays = 0;
    let lateDays = 0;
    let halfDays = 0;
    let workFromHomeDays = 0;
    let totalWorkSeconds = 0;

    records.forEach(rec => {
      totalWorkSeconds += rec.totalWorkDurationInSeconds || 0;
      if (['Working', 'Checked Out', 'Present', 'On Break', 'On Lunch'].includes(rec.status)) {
        presentDays++;
      } else if (rec.status === 'Absent') {
        absentDays++;
      } else if (rec.status === 'On Leave') {
        leaveDays++;
      } else if (rec.status === 'Work From Home') {
        workFromHomeDays++;
        presentDays++;
      } else if (rec.status === 'Half Day') {
        halfDays++;
        presentDays += 0.5;
      }
    });

    const totalWorkingHours = parseFloat((totalWorkSeconds / 3600).toFixed(1));
    const averageWorkingHours = presentDays > 0 ? parseFloat((totalWorkingHours / presentDays).toFixed(1)) : 0;
    const attendancePercentage = Math.round((presentDays / totalWorkingDays) * 100);

    res.status(200).json({
      success: true,
      data: {
        totalWorkingDays,
        presentDays,
        absentDays,
        leaveDays,
        lateDays,
        halfDays,
        workFromHomeDays,
        attendancePercentage,
        totalWorkingHours,
        averageWorkingHours,
        overtimeHours: totalWorkingHours > (presentDays * 8) ? parseFloat((totalWorkingHours - (presentDays * 8)).toFixed(1)) : 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get leave balances
// @route   GET /api/v1/attendance/leaves
exports.getLeaveBalances = async (req, res) => {
  try {
    const employee = await getOrCreateEmployee(req.user);
    res.status(200).json({
      success: true,
      data: {
        casualLeaveBalance: employee.casualLeaveBalance || 6,
        sickLeaveBalance: employee.sickLeaveBalance || 4,
        earnedLeaveBalance: employee.earnedLeaveBalance || 10,
        maternityPaternityBalance: 30
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Submit Regularization / Correction Request
// @route   POST /api/v1/attendance/regularize
exports.submitRegularization = async (req, res) => {
  try {
    const employee = await getOrCreateEmployee(req.user);
    const { date, requestedFirstLoginTime, requestedLastLogoutTime, reason } = req.body;

    const correction = await AttendanceCorrection.create({
      employee: employee._id,
      date,
      requestedFirstLoginTime,
      requestedLastLogoutTime,
      reason,
      status: 'Pending'
    });

    res.status(201).json({ success: true, message: 'Regularization request submitted for approval', data: correction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Apply Leave
// @route   POST /api/v1/attendance/apply-leave
exports.applyLeave = async (req, res) => {
  try {
    const employee = await getOrCreateEmployee(req.user);
    const { leaveType, startDate, endDate, totalDays, reason } = req.body;

    const leave = await LeaveRequest.create({
      employee: employee._id,
      leaveType,
      startDate,
      endDate,
      totalDays: totalDays || 1,
      reason,
      status: 'Pending'
    });

    res.status(201).json({ success: true, message: 'Leave application submitted successfully', data: leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
