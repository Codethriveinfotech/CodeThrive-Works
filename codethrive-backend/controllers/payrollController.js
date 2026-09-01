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

// @desc    Create individual payroll
// @route   POST /api/v1/payroll
// @access  Private (Admin/HR)
exports.createIndividualPayroll = async (req, res) => {
  try {
    const { 
      employeeId, month, basicSalary, bonus, 
      allowanceDetails, deductionDetails, 
      status, paymentDate
    } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Check if payroll for this month already exists for this employee
    const existing = await Payroll.findOne({ employee: employee._id, month });
    if (existing) {
      return res.status(400).json({ success: false, message: `Payroll for ${month} already exists for this employee.` });
    }

    // Calculate totals
    const totalAllowances = 
      (allowanceDetails?.hra || 0) + 
      (allowanceDetails?.travel || 0) + 
      (allowanceDetails?.medical || 0) + 
      (allowanceDetails?.other || 0);

    const totalDeductions = 
      (deductionDetails?.pf || 0) + 
      (deductionDetails?.esi || 0) + 
      (deductionDetails?.professionalTax || 0) + 
      (deductionDetails?.incomeTax || 0) + 
      (deductionDetails?.leaveDeduction || 0) + 
      (deductionDetails?.loanAdvance || 0) + 
      (deductionDetails?.other || 0);

    const grossSalary = Number(basicSalary) + totalAllowances + Number(bonus || 0);
    const netPayable = grossSalary - totalDeductions;

    const payslipId = `PS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    const payroll = await Payroll.create({
      employee: employee._id,
      payslipId,
      month,
      basicSalary,
      allowanceDetails,
      allowances: totalAllowances,
      bonus: bonus || 0,
      deductionDetails,
      deductions: totalDeductions,
      grossSalary,
      netPayable,
      status: status || 'Pending',
      paymentDate: paymentDate || null
    });

    res.status(201).json({ success: true, data: payroll });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
