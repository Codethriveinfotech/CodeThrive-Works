const Timesheet = require('../models/Timesheet');
const Employee = require('../models/Employee');

exports.logTimesheet = async (req, res) => {
  try {
    const { task, hours, date } = req.body;
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const newEntry = await Timesheet.create({
      employee: employee._id,
      task,
      hours: parseFloat(hours),
      date
    });
    res.status(201).json({ success: true, data: newEntry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyTimesheet = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const entries = await Timesheet.find({ employee: employee._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
