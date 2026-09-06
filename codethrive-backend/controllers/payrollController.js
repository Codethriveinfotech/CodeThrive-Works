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

// @desc    Bulk generate payroll for all active employees
// @route   POST /api/v1/payroll/bulk-generate
// @access  Private (Admin/HR)
exports.bulkGeneratePayroll = async (req, res) => {
  try {
    const { month, paymentDate, status } = req.body;
    if (!month) {
      return res.status(400).json({ success: false, message: 'Month is required' });
    }

    const employees = await Employee.find();
    if (employees.length === 0) {
      return res.status(400).json({ success: false, message: 'No employees found to generate payroll.' });
    }

    let createdCount = 0;
    let skippedCount = 0;
    const createdPayrolls = [];

    for (const emp of employees) {
      const existing = await Payroll.findOne({ employee: emp._id, month });
      if (existing) {
        skippedCount++;
        continue;
      }

      const basicSalary = emp.salaryAmount || 45000;
      const allowanceDetails = {
        hra: Math.round(basicSalary * 0.4),
        travel: 2500,
        medical: 1500,
        other: 1000
      };
      const deductionDetails = {
        pf: Math.round(basicSalary * 0.12),
        esi: 0,
        professionalTax: 200,
        incomeTax: 1500,
        leaveDeduction: 0,
        loanAdvance: 0,
        other: 0
      };

      const totalAllowances = allowanceDetails.hra + allowanceDetails.travel + allowanceDetails.medical + allowanceDetails.other;
      const totalDeductions = deductionDetails.pf + deductionDetails.professionalTax + deductionDetails.incomeTax;
      const grossSalary = basicSalary + totalAllowances;
      const netPayable = grossSalary - totalDeductions;
      const payslipId = `PS-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

      const payroll = await Payroll.create({
        employee: emp._id,
        payslipId,
        month,
        basicSalary,
        allowanceDetails,
        allowances: totalAllowances,
        bonus: 0,
        deductionDetails,
        deductions: totalDeductions,
        grossSalary,
        netPayable,
        status: status || 'Paid',
        paymentDate: paymentDate || new Date()
      });

      createdPayrolls.push(payroll);
      createdCount++;
    }

    res.status(201).json({
      success: true,
      message: `Payroll generated for ${createdCount} employee(s). (${skippedCount} skipped as already generated)`,
      count: createdCount,
      data: createdPayrolls
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
