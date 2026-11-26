const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');
const Employee = require('../models/Employee');
const AttendanceCorrection = require('../models/AttendanceCorrection');
const LeaveRequest = require('../models/LeaveRequest');
const { notifyAdminsAndHR } = require('./notificationController');

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

      // If marked Working but activeSession record is missing, recover it using firstLoginTime
      if (!activeSession && attendance.status === 'Working') {
        const startTime = attendance.firstLoginTime || attendance.date || new Date();
        activeSession = await AttendanceSession.create({
          attendanceId: attendance._id,
          employee: employee._id,
          sessionType: 'Work',
          startTime: startTime,
          status: 'Active'
        });
      }
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

    // Attendance Rules:
    // 1. Check in on or before grace time (10:15 AM) -> Present
    // 2. Check in after grace time (10:15 AM) and before 1:00 PM -> Late
    // 3. Check in after 1:00 PM (13:00) -> Half Day
    // 4. Not checked in -> On Leave
    const istTimeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
    const [h, m] = istTimeStr.split(':').map(Number);
    let initialStatus = 'Present';
    if (h >= 13) {
      initialStatus = 'Half Day';
    } else if (h > 10 || (h === 10 && m > 15)) {
      initialStatus = 'Late';
    } else {
      initialStatus = 'Present';
    }

    if (!attendance) {
      attendance = await Attendance.create({
        employee: employee._id,
        date: now,
        firstLoginTime: now,
        status: initialStatus
      });
    } else {
      if (!attendance.firstLoginTime) {
        attendance.firstLoginTime = now;
      }
      // Only set automatic status if admin has NOT manually corrected/edited it
      if (!attendance.isManualCorrection) {
        attendance.status = initialStatus;
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
        startTime: now,
        status: 'Active'
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

    // Close ANY currently active session (Work, Lunch, or prior Break)
    const activeSessions = await AttendanceSession.find({
      attendanceId: attendance._id,
      status: 'Active'
    });

    for (const active of activeSessions) {
      active.endTime = now;
      active.durationInSeconds = Math.max(0, Math.floor((now.getTime() - new Date(active.startTime).getTime()) / 1000));
      active.status = 'Completed';
      await active.save();

      if (active.sessionType === 'Work') {
        attendance.totalWorkDurationInSeconds = (attendance.totalWorkDurationInSeconds || 0) + active.durationInSeconds;
      } else if (active.sessionType === 'Lunch') {
        attendance.totalLunchDurationInSeconds = (attendance.totalLunchDurationInSeconds || 0) + active.durationInSeconds;
      }
    }

    // Start Break Session
    const breakSession = await AttendanceSession.create({
      attendanceId: attendance._id,
      employee: employee._id,
      sessionType: 'Break',
      startTime: now,
      status: 'Active'
    });

    attendance.status = 'On Break';
    await attendance.save();

    res.status(200).json({ success: true, message: 'Break started', data: { attendance, activeSession: breakSession } });
  } catch (err) {
    console.error('Error in startBreak:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Start Lunch (Pauses work session or active break)
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

    // Close ANY currently active session (Work, Break, or prior Lunch)
    const activeSessions = await AttendanceSession.find({
      attendanceId: attendance._id,
      status: 'Active'
    });

    for (const active of activeSessions) {
      active.endTime = now;
      active.durationInSeconds = Math.max(0, Math.floor((now.getTime() - new Date(active.startTime).getTime()) / 1000));
      active.status = 'Completed';
      await active.save();

      if (active.sessionType === 'Work') {
        attendance.totalWorkDurationInSeconds = (attendance.totalWorkDurationInSeconds || 0) + active.durationInSeconds;
      } else if (active.sessionType === 'Break') {
        attendance.totalBreakDurationInSeconds = (attendance.totalBreakDurationInSeconds || 0) + active.durationInSeconds;
      }
    }

    // Start Lunch Session
    const lunchSession = await AttendanceSession.create({
      attendanceId: attendance._id,
      employee: employee._id,
      sessionType: 'Lunch',
      startTime: now,
      status: 'Active'
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

    // Close ALL active Break, Lunch, or Work sessions
    const activeSessions = await AttendanceSession.find({
      attendanceId: attendance._id,
      status: 'Active'
    });

    for (const active of activeSessions) {
      active.endTime = now;
      active.durationInSeconds = Math.max(0, Math.floor((now.getTime() - new Date(active.startTime).getTime()) / 1000));
      active.status = 'Completed';
      await active.save();

      if (active.sessionType === 'Break') {
        attendance.totalBreakDurationInSeconds = (attendance.totalBreakDurationInSeconds || 0) + active.durationInSeconds;
      } else if (active.sessionType === 'Lunch') {
        attendance.totalLunchDurationInSeconds = (attendance.totalLunchDurationInSeconds || 0) + active.durationInSeconds;
      } else if (active.sessionType === 'Work') {
        attendance.totalWorkDurationInSeconds = (attendance.totalWorkDurationInSeconds || 0) + active.durationInSeconds;
      }
    }

    // Start new Work Session
    const workSession = await AttendanceSession.create({
      attendanceId: attendance._id,
      employee: employee._id,
      sessionType: 'Work',
      startTime: now,
      status: 'Active'
    });

    attendance.status = 'Working';
    await attendance.save();

    res.status(200).json({ success: true, message: 'Work resumed', data: { attendance, activeSession: workSession } });
  } catch (err) {
    console.error('Error in resumeWork:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Employee adjusts/edits today's attendance, break and lunch timings
// @route   PUT /api/v1/attendance/today
// @access  Private (Employee)
exports.updateTodayAttendance = async (req, res) => {
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

    const {
      checkInTime,
      checkOutTime,
      breakMinutes,
      lunchMinutes,
      totalBreakDurationInSeconds,
      totalLunchDurationInSeconds,
      status
    } = req.body;

    if (checkInTime) {
      if (checkInTime.includes(':') && !checkInTime.includes('T')) {
        const [h, m] = checkInTime.split(':').map(Number);
        const inDt = new Date(now);
        inDt.setHours(h, m, 0, 0);
        attendance.firstLoginTime = inDt;
      } else {
        attendance.firstLoginTime = new Date(checkInTime);
      }
    }

    if (checkOutTime !== undefined) {
      if (!checkOutTime) {
        attendance.lastLogoutTime = null;
      } else if (checkOutTime.includes(':') && !checkOutTime.includes('T')) {
        const [h, m] = checkOutTime.split(':').map(Number);
        const outDt = new Date(now);
        outDt.setHours(h, m, 0, 0);
        attendance.lastLogoutTime = outDt;
      } else {
        attendance.lastLogoutTime = new Date(checkOutTime);
      }
    }

    // Set Break & Lunch seconds
    const breakSec = totalBreakDurationInSeconds !== undefined 
      ? Number(totalBreakDurationInSeconds) 
      : (breakMinutes !== undefined ? Number(breakMinutes) * 60 : (attendance.totalBreakDurationInSeconds || 0));
    
    const lunchSec = totalLunchDurationInSeconds !== undefined 
      ? Number(totalLunchDurationInSeconds) 
      : (lunchMinutes !== undefined ? Number(lunchMinutes) * 60 : (attendance.totalLunchDurationInSeconds || 0));

    attendance.totalBreakDurationInSeconds = Math.max(0, breakSec);
    attendance.totalLunchDurationInSeconds = Math.max(0, lunchSec);

    // Calculate Net Work Hours:
    // (outTime - inTime) - (breakSec + lunchSec)
    const inTimeMs = attendance.firstLoginTime ? new Date(attendance.firstLoginTime).getTime() : now.getTime();
    const outTimeMs = attendance.lastLogoutTime ? new Date(attendance.lastLogoutTime).getTime() : now.getTime();
    const grossElapsedSec = Math.max(0, Math.floor((outTimeMs - inTimeMs) / 1000));
    const totalBreakLunchSec = attendance.totalBreakDurationInSeconds + attendance.totalLunchDurationInSeconds;

    attendance.totalWorkDurationInSeconds = Math.max(0, grossElapsedSec - totalBreakLunchSec);

    if (status) {
      attendance.status = status;
    } else if (attendance.lastLogoutTime) {
      attendance.status = 'Checked Out';
    }

    attendance.isManualCorrection = true;
    attendance.correctionReason = req.body.reason || 'Manual break, lunch, and timing adjustment';

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Today attendance, break, and lunch updated successfully',
      data: { attendance }
    });
  } catch (err) {
    console.error('Error in updateTodayAttendance:', err);
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
        totalWorkDurationInSeconds: 0,
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

      // Complete elapsed work time fallback guarantee
      if (attendance.firstLoginTime) {
        const totalElapsed = Math.floor((now.getTime() - new Date(attendance.firstLoginTime).getTime()) / 1000);
        const breakLunch = (attendance.totalBreakDurationInSeconds || 0) + (attendance.totalLunchDurationInSeconds || 0);
        const netWork = Math.max(0, totalElapsed - breakLunch);
        attendance.totalWorkDurationInSeconds = Math.max(attendance.totalWorkDurationInSeconds || 0, netWork);
      }

      attendance.lastLogoutTime = now;
      // Only set automatic status on checkout if admin has NOT manually set/corrected it
      if (!attendance.isManualCorrection) {
        if (attendance.firstLoginTime) {
          const istTimeStr = new Date(attendance.firstLoginTime).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
          const [h, m] = istTimeStr.split(':').map(Number);
          if (h >= 13) {
            attendance.status = 'Half Day';
          } else if (h > 10 || (h === 10 && m > 15)) {
            attendance.status = 'Late';
          } else {
            attendance.status = 'Present';
          }
        } else {
          attendance.status = 'On Leave';
        }
      }
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

    // Dynamic working days computation (Monday to Saturday, excluding Sundays and gazetted public holidays)
    const fixedHolidays = [
      '01-01', // New Year’s Day
      '01-15', // Pongal
      '01-16', // Thiruvalluvar Day
      '01-17', // Uzhavar Thirunal
      '01-26', // Republic Day
      '03-19', // Telugu New Year
      '03-21', // Ramzan
      '03-31', // Mahaveer Jayanthi
      '04-03', // Good Friday
      '04-14', // Tamil New Year / Ambedkar Jayanti
      '05-01', // May Day
      '05-28', // Bakrid
      '06-26', // Muharram
      '08-15', // Independence Day
      '08-26', // Milad-un-Nabi
      '09-04', // Krishna Jayanthi
      '09-14', // Vinayakar Chathurthi
      '10-02', // Gandhi Jayanthi
      '10-19', // Ayutha Pooja
      '10-20', // Vijaya Dasami
      '12-25', // Christmas
    ];

    const daysInMonth = new Date(y, m, 0).getDate();
    let totalWorkingDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(y, m - 1, day);
      if (d.getDay() === 0) continue; // Sunday off
      const mmdd = `${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (fixedHolidays.includes(mmdd)) continue; // Holiday off
      totalWorkingDays++;
    }

    let presentDays = 0;
    let absentDays = 0;
    let leaveDays = 0;
    let lateDays = 0;
    let halfDays = 0;
    let permissionDays = 0;
    let workFromHomeDays = 0;
    let totalWorkSeconds = 0;

    records.forEach(rec => {
      totalWorkSeconds += rec.totalWorkDurationInSeconds || 0;
      if (['Working', 'Checked Out', 'Present', 'On Break', 'On Lunch', 'Late'].includes(rec.status)) {
        presentDays++;
        if (rec.status === 'Late') lateDays++;
      } else if (rec.status === 'Permission') {
        permissionDays++;
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
    const attendancePercentage = totalWorkingDays > 0 ? Math.min(100, Math.round((presentDays / totalWorkingDays) * 100)) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalWorkingDays,
        presentDays,
        absentDays,
        leaveDays,
        lateDays,
        halfDays,
        permissionDays,
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
        sickLeaveBalance: employee.sickLeaveBalance || 12,
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
    const { 
      date, 
      correctionType,
      customType,
      checkInTime, 
      checkOutTime, 
      breakMinutes, 
      lunchMinutes,
      reason 
    } = req.body;

    const typeLabel = correctionType === 'Others' 
      ? `Other: ${customType || 'Custom Adjustment'}` 
      : (correctionType || 'Timing Adjustment');
    
    // Build comprehensive readable explanation in reason
    const parts = [typeLabel];
    if (checkInTime) parts.push(`Check-In: ${checkInTime}`);
    if (checkOutTime) parts.push(`Check-Out: ${checkOutTime}`);
    if (breakMinutes !== undefined && breakMinutes !== '' && Number(breakMinutes) > 0) parts.push(`Break: ${breakMinutes}m`);
    if (lunchMinutes !== undefined && lunchMinutes !== '' && Number(lunchMinutes) > 0) parts.push(`Lunch: ${lunchMinutes}m`);
    if (reason) parts.push(`Note: ${reason}`);
    const fullReason = parts.join(' | ');

    const correction = await AttendanceCorrection.create({
      employee: employee._id,
      date: date ? new Date(date) : new Date(),
      reason: fullReason,
      requested_checkout_time: checkOutTime || null,
      status: 'Pending'
    });

    // Notify admins of attendance correction request
    const dateFormatted = date ? new Date(date).toLocaleDateString('en-IN') : 'Recent Date';
    await notifyAdminsAndHR(
      'Attendance Correction Request',
      `${employee.fullName} submitted attendance correction for ${dateFormatted}: "${typeLabel}".`,
      'Attendance',
      'High',
      '/admin/attendance'
    );

    res.status(201).json({ 
      success: true, 
      message: 'Attendance correction request submitted to Admin/HR successfully', 
      data: correction 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get logged in employee's correction requests
// @route   GET /api/v1/attendance/my-corrections
exports.getMyCorrections = async (req, res) => {
  try {
    const employee = await getOrCreateEmployee(req.user);
    const corrections = await AttendanceCorrection.find({ employee: employee._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: corrections || [] });
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

    // Notify admins of leave application
    await notifyAdminsAndHR(
      'New Leave Request Applied',
      `${employee.fullName} applied for ${totalDays || 1} day(s) of ${leaveType || 'General'} leave: "${reason || 'Leave application'}".`,
      'Leave',
      'High',
      '/admin/leave'
    );

    res.status(201).json({ success: true, message: 'Leave application submitted successfully', data: leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
