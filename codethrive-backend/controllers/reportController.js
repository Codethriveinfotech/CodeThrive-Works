const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');
const Task = require('../models/Task');

// @desc    Get summary report data
// @route   GET /api/v1/reports/summary
// @access  Private (Admin/HR)
exports.getSummaryReport = async (req, res) => {
  try {
    const { type } = req.query; // 'attendance', 'employee', 'task', 'payroll'

    let data = {};

    if (type === 'employee') {
      const active = await Employee.countDocuments({ status: 'Active' });
      const pending = await Employee.countDocuments({ status: 'Pending' });
      const departments = await Employee.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } }
      ]);
      data = { active, pending, departments };
    } else if (type === 'payroll') {
      const totalPayout = await Payroll.aggregate([
        { $group: { _id: null, total: { $sum: '$netPayable' } } }
      ]);
      const byMonth = await Payroll.aggregate([
        { $group: { _id: '$month', total: { $sum: '$netPayable' } } }
      ]);
      data = { totalPayout: totalPayout[0]?.total || 0, byMonth };
    } else if (type === 'attendance') {
      const today = new Date();
      today.setHours(0,0,0,0);
      const totalAttendances = await Attendance.countDocuments({ date: { $gte: today } });
      data = { todayAttendances: totalAttendances };
    } else if (type === 'task') {
      // Mock task report until task schema is fully populated
      data = { totalTasks: 120, completed: 85, pending: 35 };
    }

    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
