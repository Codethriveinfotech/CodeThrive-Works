const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');

// @desc    Get all payslips for current user
// @route   GET /api/v1/payroll/my-payslips
// @access  Private
exports.getMyPayslips = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const payslips = await Payroll.find({ employee: employee._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: payslips.length, data: payslips });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all payroll history
// @route   GET /api/v1/payroll
// @access  Private (Admin/HR)
exports.getAllPayroll = async (req, res) => {
  try {
    const payrolls = await Payroll.find().populate('employee', 'fullName employeeId department designation');
    res.status(200).json({ success: true, count: payrolls.length, data: payrolls });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Process monthly payroll
// @route   POST /api/v1/payroll/process
// @access  Private (Admin/HR)
exports.processPayroll = async (req, res) => {
  try {
    const { month } = req.body; // e.g. "June 2026"
    
    // Check if already processed for this month
    const existing = await Payroll.findOne({ month });
    if (existing) {
      return res.status(400).json({ success: false, message: `Payroll for ${month} has already been processed.` });
    }

    const employees = await Employee.find({ status: { $in: ['Active', 'Approved'] } });
    if (employees.length === 0) {
      return res.status(400).json({ success: false, message: 'No active employees to process.' });
    }

    const payrolls = [];
    
    employees.forEach(emp => {
      const basicSalary = emp.salaryAmount || 25000; // default for demo
      const allowances = basicSalary * 0.2; // 20%
      const deductions = basicSalary * 0.05; // 5%
      const gross = basicSalary + allowances;
      const netPayable = gross - deductions;

      payrolls.push({
        employee: emp._id,
        payslipId: `PS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        month,
        basicSalary,
        allowances,
        deductions,
        grossSalary: gross,
        netPayable,
        status: 'Paid'
      });
    });

    await Payroll.insertMany(payrolls);

    res.status(201).json({ success: true, message: `Successfully processed payroll for ${employees.length} employees.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
