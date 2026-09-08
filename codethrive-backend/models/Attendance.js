const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  firstLoginTime: {
    type: Date,
    required: true
  },
  lastLogoutTime: {
    type: Date
  },
  totalWorkDurationInSeconds: {
    type: Number,
    default: 0
  },
  totalBreakDurationInSeconds: {
    type: Number,
    default: 0
  },
  totalLunchDurationInSeconds: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Not Checked In', 'Working', 'On Break', 'On Lunch', 'Checked Out', 'Present', 'Late', 'Half Day', 'Absent', 'Work From Home', 'On Leave'],
    default: 'Working'
  },
  isManualCorrection: {
    type: Boolean,
    default: false
  },
  correctionReason: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Attendance', attendanceSchema);
