const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// Helper: Get start & end of a given date (or today)
const getDayRange = (dateStr) => {
  const base = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const end = new Date(base);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @desc    Get attendance register for a specific date (all employees)
// @route   GET /api/v1/admin/attendance/register?date=YYYY-MM-DD
// @access  Private (Admin / HR)
exports.getAttendanceRegister = async (req, res) => {
  try {
    const { date } = req.query;
    const { start, end } = getDayRange(date);

    // Fetch all active employees
    const employees = await Employee.find({
      status: { $in: ['Active', 'Approved'] }
    })
      .populate('user', 'email role status')
      .sort({ fullName: 1 });

    // Fetch all attendance records for the given date
    const attendances = await Attendance.find({
      date: { $gte: start, $lte: end }
    }).lean();

    // Build a map: employee._id (string) -> attendance record
    const attMap = new Map();
    attendances.forEach(a => attMap.set(a.employee.toString(), a));

    // Merge
    const register = employees.map(emp => {
      const att = attMap.get(emp._id.toString());
      return {
        employeeId: emp._id,
        empCode: emp.employeeId,
        fullName: emp.fullName,
        department: emp.department || 'General',
        designation: emp.designation || 'Employee',
        profilePhoto: emp.profilePhoto || null,
        attendanceId: att ? att._id : null,
        status: att ? att.status : 'Absent',
        firstLoginTime: att ? att.firstLoginTime : null,
        lastLogoutTime: att ? att.lastLogoutTime : null,
        totalWorkDurationInSeconds: att ? att.totalWorkDurationInSeconds : 0,
        isManualCorrection: att ? att.isManualCorrection : false,
        correctionReason: att ? att.correctionReason : null,
      };
    });

    // Summary stats
    const summary = {
      total: register.length,
      present: register.filter(r => ['Working', 'Checked Out', 'On Break', 'On Lunch', 'Present', 'Work From Home', 'Late', 'Permission'].includes(r.status)).length,
      absent: register.filter(r => r.status === 'Absent').length,
      permission: register.filter(r => r.status === 'Permission').length,
      onLeave: register.filter(r => r.status === 'On Leave').length,
      halfDay: register.filter(r => r.status === 'Half Day').length,
      wfh: register.filter(r => r.status === 'Work From Home').length,
      late: register.filter(r => r.status === 'Late').length,
    };

    res.status(200).json({
      success: true,
      date: start.toISOString().split('T')[0],
      summary,
      data: register,
    });
  } catch (err) {
    console.error('getAttendanceRegister error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Mark / Update attendance for one employee (admin manual)
// @route   POST /api/v1/admin/attendance/mark
// @body    { employeeId, date, status, firstLoginTime?, lastLogoutTime?, correctionReason? }
// @access  Private (Admin / HR)
exports.markAttendance = async (req, res) => {
  try {
    const {
      employeeId,
      date,
      status,
      firstLoginTime,
      lastLogoutTime,
      correctionReason,
    } = req.body;

    if (!employeeId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'employeeId, date, and status are required.',
      });
    }

    const validStatuses = [
      'Present', 'Absent', 'Permission', 'On Leave', 'Half Day',
      'Work From Home', 'Late', 'Working', 'Checked Out',
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${validStatuses.join(', ')}`,
      });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const { start, end } = getDayRange(date);
    let attendance = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: start, $lte: end },
    });

    const now = new Date();
    const loginTime = firstLoginTime ? new Date(firstLoginTime) : now;

    if (attendance) {
      attendance.status = status;
      attendance.isManualCorrection = true;
      attendance.correctionReason = correctionReason || 'Admin manual mark';
      if (firstLoginTime) attendance.firstLoginTime = loginTime;
      if (lastLogoutTime) attendance.lastLogoutTime = new Date(lastLogoutTime);
      if (firstLoginTime && lastLogoutTime) {
        const workMs = new Date(lastLogoutTime) - new Date(firstLoginTime);
        attendance.totalWorkDurationInSeconds = Math.max(0, Math.floor(workMs / 1000));
      }
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        employee: employeeId,
        date: new Date(date),
        firstLoginTime: loginTime,
        lastLogoutTime: lastLogoutTime ? new Date(lastLogoutTime) : undefined,
        status,
        totalWorkDurationInSeconds:
          firstLoginTime && lastLogoutTime
            ? Math.max(0, Math.floor((new Date(lastLogoutTime) - new Date(firstLoginTime)) / 1000))
            : 0,
        isManualCorrection: true,
        correctionReason: correctionReason || 'Admin manual mark',
      });
    }

    res.status(200).json({
      success: true,
      message: `Attendance marked as "${status}" for ${employee.fullName}`,
      data: attendance,
    });
  } catch (err) {
    console.error('markAttendance error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Bulk mark attendance for multiple employees
// @route   POST /api/v1/admin/attendance/bulk-mark
// @body    { date, records: [{ employeeId, status, correctionReason? }] }
// @access  Private (Admin / HR)
exports.bulkMarkAttendance = async (req, res) => {
  try {
    const { date, records } = req.body;

    if (!date || !records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'date and records[] are required.' });
    }

    const { start, end } = getDayRange(date);
    const results = [];
    const errors = [];

    for (const record of records) {
      try {
        const { employeeId, status, firstLoginTime, lastLogoutTime, correctionReason } = record;

        const employee = await Employee.findById(employeeId);
        if (!employee) {
          errors.push({ employeeId, error: 'Employee not found' });
          continue;
        }

        let attendance = await Attendance.findOne({
          employee: employeeId,
          date: { $gte: start, $lte: end },
        });

        const now = new Date();
        const loginTime = firstLoginTime ? new Date(firstLoginTime) : now;

        if (attendance) {
          attendance.status = status;
          attendance.isManualCorrection = true;
          attendance.correctionReason = correctionReason || 'Admin bulk mark';
          if (firstLoginTime) attendance.firstLoginTime = loginTime;
          if (lastLogoutTime) attendance.lastLogoutTime = new Date(lastLogoutTime);
          await attendance.save();
        } else {
          attendance = await Attendance.create({
            employee: employeeId,
            date: new Date(date),
            firstLoginTime: loginTime,
            lastLogoutTime: lastLogoutTime ? new Date(lastLogoutTime) : undefined,
            status,
            isManualCorrection: true,
            correctionReason: correctionReason || 'Admin bulk mark',
          });
        }

        results.push({ employeeId, status, success: true });
      } catch (innerErr) {
        errors.push({ employeeId: record.employeeId, error: innerErr.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk attendance saved. ${results.length} updated, ${errors.length} errors.`,
      results,
      errors,
    });
  } catch (err) {
    console.error('bulkMarkAttendance error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get attendance history / monthly report for admin view
// @route   GET /api/v1/admin/attendance/monthly?month=M&year=YYYY&employeeId=optional
// @access  Private (Admin / HR)
exports.getMonthlyReport = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;
    const m = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    const y = year ? parseInt(year, 10) : new Date().getFullYear();

    const startOfMonth = new Date(y, m - 1, 1);
    const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);

    let query = { date: { $gte: startOfMonth, $lte: endOfMonth } };
    if (employeeId) query.employee = employeeId;

    const records = await Attendance.find(query)
      .populate('employee', 'fullName employeeId department designation profilePhoto')
      .sort({ date: -1, 'employee.fullName': 1 })
      .lean();

    res.status(200).json({
      success: true,
      month: m,
      year: y,
      count: records.length,
      data: records,
    });
  } catch (err) {
    console.error('getMonthlyReport error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
