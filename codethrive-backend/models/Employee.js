const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // User is linked AFTER approval and credentials creation
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Active', 'Inactive', 'Suspended'],
    default: 'Pending'
  },
  
  // 1. Personal Details
  fullName: { type: String, required: true },
  profilePhoto: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
  bloodGroup: { type: String },
  personalPhoneNumber: { type: String, required: true },
  personalEmailAddress: { type: String, required: true, unique: true },
  currentAddress: { type: String },
  permanentAddress: { type: String },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },

  // 2. Professional Details
  department: { type: String },
  designation: { type: String },
  employmentType: { type: String, enum: ['Full-Time', 'Part-Time', 'Contract', 'Internship'] },
  dateOfJoining: { type: Date },
  workLocation: { type: String, enum: ['Office', 'Remote', 'Hybrid'], default: 'Office' },
  reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  qualification: { type: String },
  collegeName: { type: String },
  graduationYear: { type: String },
  previousCompany: { type: String },
  totalExperience: { type: String },
  skills: [String],
  technologyKnowledge: [String],
  resumeUpload: { type: String },

  // 3. Identity and Document Details
  aadhaarOrIdentityProofNumber: { type: String },
  identityProofUpload: { type: String },
  addressProofUpload: { type: String },
  educationalCertificateUpload: { type: String },
  experienceCertificateUpload: { type: String },
  offerLetterUpload: { type: String },
  passportSizePhotoUpload: { type: String },

  // 4. Bank and Payroll Details (Sensitive)
  bankAccountHolderName: { type: String },
  bankName: { type: String },
  accountNumber: { type: String },
  ifscCode: { type: String },
  branchName: { type: String },
  panNumber: { type: String },
  upiId: { type: String },
  salaryAmount: { type: Number },
  salaryType: { type: String, enum: ['Monthly', 'Hourly', 'Project-Based'] }
}, {
  timestamps: true
});

module.exports = mongoose.model('Employee', employeeSchema);
