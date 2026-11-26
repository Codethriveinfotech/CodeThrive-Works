const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const AttendanceCorrection = require('../models/AttendanceCorrection');

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

    // Fetch all active employees (excluding Admin/Superadmin accounts)
    const allEmployees = await Employee.find({
      status: { $in: ['Active', 'Approved'] }
    })
      .populate('user', 'email role status')
      .sort({ fullName: 1 });

    const employees = allEmployees.filter(emp => {
      const role = (emp.user?.role || emp.role || '').toLowerCase();
      const empId = (emp.employeeId || '').toUpperCase();
      const name = (emp.fullName || '').toLowerCase();
      const email = (emp.personalEmailAddress || emp.email || emp.user?.email || '').toLowerCase();
      if (['admin', 'superadmin', 'management'].includes(role)) return false;
      if (empId === 'CTI-ADM-001' || empId.startsWith('CTI-ADM')) return false;
      if (name.includes('codethrive admin') || name === 'system administrator') return false;
      if (email === 'admin@codethrive.com') return false;
      return true;
    });

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
        status: (() => {
          // 1. If admin manually marked/corrected -> ALWAYS respect admin's status
          if (att && att.isManualCorrection && att.status) {
            return att.status;
          }
          // 2. Explicit approved leave or permission
          if (att && att.status && ['Permission', 'On Leave', 'Absent', 'Half Day'].includes(att.status)) {
            return att.status;
          }
          // 3. Not checked in yet
          if (!att || !att.firstLoginTime) {
            return att?.status || 'On Leave';
          }
          // 4. Automatic calculation based on login time
          const dt = new Date(att.firstLoginTime);
          const istStr = dt.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
          const [h, m] = istStr.split(':').map(Number);
          if (h >= 13) return 'Half Day';
          if (h > 10 || (h === 10 && m > 15)) return 'Late';
          return 'Present';
        })(),
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
      present: register.filter(r => ['Working', 'Checked Out', 'On Break', 'On Lunch', 'Present', 'Late', 'Permission'].includes(r.status)).length,
      absent: register.filter(r => r.status === 'Absent').length,
      permission: register.filter(r => r.status === 'Permission').length,
      onLeave: register.filter(r => r.status === 'On Leave').length,
      halfDay: register.filter(r => r.status === 'Half Day').length,
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
      breakMinutes,
      lunchMinutes,
      totalBreakDurationInSeconds,
      totalLunchDurationInSeconds
    } = req.body;

    if (!employeeId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'employeeId, date, and status are required.',
      });
    }

    const validStatuses = [
      'Present', 'Absent', 'Permission', 'On Leave', 'Half Day',
      'Late', 'Working', 'Checked Out',
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

    const breakSec = totalBreakDurationInSeconds !== undefined
      ? Number(totalBreakDurationInSeconds)
      : (breakMinutes !== undefined ? Number(breakMinutes) * 60 : (attendance?.totalBreakDurationInSeconds || 0));
    const lunchSec = totalLunchDurationInSeconds !== undefined
      ? Number(totalLunchDurationInSeconds)
      : (lunchMinutes !== undefined ? Number(lunchMinutes) * 60 : (attendance?.totalLunchDurationInSeconds || 0));

    if (attendance) {
      attendance.status = status;
      attendance.isManualCorrection = true;
      attendance.correctionReason = correctionReason || 'Admin manual mark';
      if (firstLoginTime) attendance.firstLoginTime = loginTime;
      if (lastLogoutTime) attendance.lastLogoutTime = new Date(lastLogoutTime);
      attendance.totalBreakDurationInSeconds = breakSec;
      attendance.totalLunchDurationInSeconds = lunchSec;

      if (firstLoginTime && lastLogoutTime) {
        const totalBreakLunchSec = breakSec + lunchSec;
        const workMs = new Date(lastLogoutTime) - new Date(firstLoginTime);
        attendance.totalWorkDurationInSeconds = Math.max(0, Math.floor(workMs / 1000) - totalBreakLunchSec);
      }
      await attendance.save();
    } else {
      const totalBreakLunchSec = breakSec + lunchSec;
      const initialWorkSec = (firstLoginTime && lastLogoutTime)
        ? Math.max(0, Math.floor((new Date(lastLogoutTime) - new Date(firstLoginTime)) / 1000) - totalBreakLunchSec)
        : 0;

      attendance = await Attendance.create({
        employee: employeeId,
        date: new Date(date),
        firstLoginTime: loginTime,
        lastLogoutTime: lastLogoutTime ? new Date(lastLogoutTime) : undefined,
        status,
        totalBreakDurationInSeconds: breakSec,
        totalLunchDurationInSeconds: lunchSec,
        totalWorkDurationInSeconds: initialWorkSec,
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

    const cleanRecords = records.filter(r => {
      const emp = r.employee;
      if (!emp) return false;
      const empId = (emp.employeeId || '').toUpperCase();
      const name = (emp.fullName || '').toLowerCase();
      if (empId === 'CTI-ADM-001' || empId.startsWith('CTI-ADM')) return false;
      if (name.includes('codethrive admin') || name === 'system administrator') return false;
      return true;
    });

    res.status(200).json({
      success: true,
      month: m,
      year: y,
      count: cleanRecords.length,
      data: cleanRecords,
    });
  } catch (err) {
    console.error('getMonthlyReport error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all attendance correction requests
// @route   GET /api/v1/admin/attendance/corrections
exports.getAttendanceCorrections = async (req, res) => {
  try {
    const corrections = await AttendanceCorrection.find()
      .populate('employee', 'fullName employeeId department designation email profilePhoto')
      .populate('approvedBy', 'email name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: corrections || []
    });
  } catch (err) {
    console.error('getAttendanceCorrections error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Approve or Reject attendance correction request
// @route   PUT /api/v1/admin/attendance/corrections/:id/status
exports.updateCorrectionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' | 'Rejected'

    const correction = await AttendanceCorrection.findById(id);
    if (!correction) {
      return res.status(404).json({ success: false, message: 'Attendance correction request not found.' });
    }

    correction.status = status;
    correction.approvedBy = req.user ? req.user._id : null;
    correction.approvedAt = new Date();
    await correction.save();

    if (status === 'Approved') {
      const { start, end } = getDayRange(correction.date);
      let attendance = await Attendance.findOne({
        employee: correction.employee,
        date: { $gte: start, $lte: end }
      });

      const reasonStr = correction.reason || '';
      let inTimeStr = null;
      let outTimeStr = null;
      let breakMins = 0;
      let lunchMins = 0;

      const inMatch = reasonStr.match(/Check-In:\s*([0-9:]+\s*(?:AM|PM)?)/i);
      const outMatch = reasonStr.match(/Check-Out:\s*([0-9:]+\s*(?:AM|PM)?)/i);
      const breakMatch = reasonStr.match(/Break:\s*(\d+)m/i);
      const lunchMatch = reasonStr.match(/Lunch:\s*(\d+)m/i);

      if (inMatch) inTimeStr = inMatch[1].trim();
      if (outMatch) outTimeStr = outMatch[1].trim();
      if (breakMatch) breakMins = parseInt(breakMatch[1], 10);
      if (lunchMatch) lunchMins = parseInt(lunchMatch[1], 10);

      const toDateObj = (tStr, baseDate) => {
        if (!tStr) return null;
        const d = new Date(baseDate);
        if (tStr.includes(':')) {
          let [hh, mm] = tStr.replace(/[^\d:]/g, '').split(':').map(Number);
          if (tStr.toLowerCase().includes('pm') && hh < 12) hh += 12;
          if (tStr.toLowerCase().includes('am') && hh === 12) hh = 0;
          d.setHours(hh || 0, mm || 0, 0, 0);
          return d;
        }
        return null;
      };

      const loginTime = toDateObj(inTimeStr, correction.date) || new Date(correction.date);
      const logoutTime = toDateObj(outTimeStr, correction.date);
      const breakSec = (breakMins || 0) * 60;
      const lunchSec = (lunchMins || 0) * 60;

      let netWorkSec = 28800;
      if (loginTime && logoutTime) {
        const totalShiftSec = Math.max(0, Math.floor((logoutTime - loginTime) / 1000));
        netWorkSec = Math.max(0, totalShiftSec - (breakSec + lunchSec));
      }

      if (!attendance) {
        attendance = await Attendance.create({
          employee: correction.employee,
          date: new Date(correction.date),
          firstLoginTime: loginTime,
          lastLogoutTime: logoutTime,
          totalWorkDurationInSeconds: netWorkSec,
          totalBreakDurationInSeconds: breakSec,
          totalLunchDurationInSeconds: lunchSec,
          status: 'Present',
          isManualCorrection: true,
          correctionReason: `Approved Correction: ${reasonStr}`
        });
      } else {
        attendance.status = 'Present';
        if (loginTime) attendance.firstLoginTime = loginTime;
        if (logoutTime) attendance.lastLogoutTime = logoutTime;
        if (breakSec > 0) attendance.totalBreakDurationInSeconds = breakSec;
        if (lunchSec > 0) attendance.totalLunchDurationInSeconds = lunchSec;
        attendance.totalWorkDurationInSeconds = netWorkSec;
        attendance.isManualCorrection = true;
        attendance.correctionReason = `Approved Correction: ${reasonStr}`;
        await attendance.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Correction request marked as ${status}.`,
      data: correction
    });
  } catch (err) {
    console.error('updateCorrectionStatus error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
