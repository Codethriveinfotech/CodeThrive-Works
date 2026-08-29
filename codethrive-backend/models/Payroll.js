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
  allowances: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  grossSalary: { type: Number, required: true },
  netPayable: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Processed', 'Paid'],
    default: 'Paid'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payroll', payrollSchema);
