const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  payslipId: {
    type: String,
    required: true
  },
  month: {
    type: String, // e.g. "June 2026"
    required: true
  },
  basicSalary: { type: Number, required: true },
  
  // Allowance Breakdown
  allowances: { type: Number, default: 0 }, // Total of all allowances (for backward compatibility)
  bonus: { type: Number, default: 0 },
  allowanceDetails: {
    hra: { type: Number, default: 0 },
    travel: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },

  // Deduction Breakdown
  deductions: { type: Number, default: 0 }, // Total of all deductions
  deductionDetails: {
    pf: { type: Number, default: 0 },
    esi: { type: Number, default: 0 },
    professionalTax: { type: Number, default: 0 },
    incomeTax: { type: Number, default: 0 },
    leaveDeduction: { type: Number, default: 0 },
    loanAdvance: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },

  grossSalary: { type: Number, required: true },
  netPayable: { type: Number, required: true },
  paymentDate: { type: Date },
  status: {
    type: String,
    enum: ['Pending', 'Processed', 'Paid'],
    default: 'Paid'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payroll', payrollSchema);
