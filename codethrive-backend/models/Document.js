const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  documentType: {
    type: String,
    enum: ['Policy', 'Contract', 'Payslip', 'ID Proof', 'Certificate', 'Other'],
    default: 'Other'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee', // User who owns the doc, null for company-wide policies
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  isPublic: {
    type: Boolean, // True for company-wide policies
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Document', documentSchema);
