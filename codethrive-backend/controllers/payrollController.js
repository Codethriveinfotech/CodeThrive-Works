const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');

// Helper to filter out un-uploaded/seed payrolls
const isSeedPayroll = (p) => {
  if (p.payslipId === 'PAY-2026-09-001' || p.month === 'September 2026') return true;
  return false;
};

const EMP_POPULATE_FIELDS = 'fullName employeeId department designation accountNumber bankName ifscCode bankAccountHolderName branchName panNumber upiId dateOfBirth dateOfJoining';

// @desc    Get all payslips for current user
// @route   GET /api/v1/payroll/my-payslips
// @access  Private
exports.getMyPayslips = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const rawPayslips = await Payroll.find({ employee: employee._id })
      .populate('employee', EMP_POPULATE_FIELDS)
      .sort({ createdAt: -1 });

    const payslips = (rawPayslips || []).filter(p => !isSeedPayroll(p)).map(p => {
      // Ensure employee's bank details are properly embedded in employeeInfo
      const emp = p.employee || employee;
      const empInfo = p.employeeInfo || {};
      return {
        ...p,
        employeeInfo: {
          ...empInfo,
          bankAcNo: emp?.accountNumber || empInfo.bankAcNo || '',
          bankName: emp?.bankName || empInfo.bankName || '',
          ifscCode: emp?.ifscCode || empInfo.ifscCode || '',
          accountHolderName: emp?.bankAccountHolderName || emp?.fullName || empInfo.accountHolderName || ''
        }
      };
    });

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
    const rawPayrolls = await Payroll.find()
      .populate('employee', EMP_POPULATE_FIELDS);

    const payrolls = (rawPayrolls || []).filter(p => !isSeedPayroll(p)).map(p => {
      const emp = p.employee || {};
      const empInfo = p.employeeInfo || {};
      return {
        ...p,
        employeeInfo: {
          ...empInfo,
          bankAcNo: emp?.accountNumber || empInfo.bankAcNo || '',
          bankName: emp?.bankName || empInfo.bankName || '',
          ifscCode: emp?.ifscCode || empInfo.ifscCode || '',
          accountHolderName: emp?.bankAccountHolderName || emp?.fullName || empInfo.accountHolderName || ''
        }
      };
    });

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
      status, paymentDate, employeeInfo, leaveStatus
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
      (allowanceDetails?.da || 0) +
      (allowanceDetails?.hra || 0) + 
      (allowanceDetails?.conveyance || 0) + 
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

    const payslipId = `CTI-PSL-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

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
      paymentDate: paymentDate || null,
      employeeInfo: employeeInfo || {
        dob: employee.dateOfBirth,
        doj: employee.dateOfJoining,
        bankAcNo: employee.accountNumber || '',
        bankName: employee.bankName || '',
        ifscCode: employee.ifscCode || '',
        accountHolderName: employee.bankAccountHolderName || employee.fullName,
        pfNo: employee.panNumber ? `TN/CBE/PF/${employee.employeeId}` : '',
        pfPercent: 12,
        esiNo: ''
      },
      leaveStatus: leaveStatus || {
        cl: { eligible: 12, availed: 1, balance: 11 },
        el: { eligible: 15, availed: 0, balance: 15 },
        ml: { eligible: 0, availed: 0, balance: 0 },
        lop: 0
      }
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

      const basicSalary = Number(emp.salaryAmount) || 45000;
      const allowanceDetails = {
        da: Math.round(basicSalary * 0.1),
        hra: Math.round(basicSalary * 0.25),
        conveyance: 3000,
        travel: 2000,
        medical: 1500,
        other: 2000
      };
      const totalAllowances = 
        allowanceDetails.da + 
        allowanceDetails.hra + 
        allowanceDetails.conveyance + 
        allowanceDetails.travel + 
        allowanceDetails.medical + 
        allowanceDetails.other;

      const deductionDetails = {
        pf: Math.round(basicSalary * 0.12),
        esi: 0,
        professionalTax: 200,
        incomeTax: basicSalary > 50000 ? Math.round(basicSalary * 0.05) : 1000,
        leaveDeduction: 0,
        loanAdvance: 0,
        other: 0
      };

      const totalDeductions = 
        deductionDetails.pf + 
        deductionDetails.esi + 
        deductionDetails.professionalTax + 
        deductionDetails.incomeTax + 
        deductionDetails.leaveDeduction + 
        deductionDetails.loanAdvance + 
        deductionDetails.other;

      const grossSalary = basicSalary + totalAllowances;
      const netPayable = grossSalary - totalDeductions;
      const payslipId = `CTI-PSL-${new Date().getFullYear()}-${String(1000 + createdCount + 1)}`;

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
        paymentDate: paymentDate || new Date(),
        employeeInfo: {
          dob: emp.dateOfBirth || '1998-05-15',
          doj: emp.dateOfJoining || '2024-01-15',
          bankAcNo: emp.accountNumber || '',
          bankName: emp.bankName || '',
          ifscCode: emp.ifscCode || '',
          accountHolderName: emp.bankAccountHolderName || emp.fullName,
          pfNo: `TN/CBE/PF/${emp.employeeId || '001'}`,
          pfPercent: 12,
          esiNo: ''
        },
        leaveStatus: {
          cl: { eligible: 12, availed: 1, balance: 11 },
          el: { eligible: 15, availed: 0, balance: 15 },
          ml: { eligible: 0, availed: 0, balance: 0 },
          lop: 0
        }
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
