const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  projectTitle: {
    type: String,
    default: 'General Project'
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  tasksWorked: {
    type: String,
    required: true
  },
  hoursWorked: {
    type: Number,
    required: true
  },
  workSummary: {
    type: String,
    required: true
  },
  completedWork: {
    type: String
  },
  pendingWork: {
    type: String
  },
  issuesFaced: {
    type: String
  },
  progressStatus: {
    type: String,
    default: 'Completed'
  },
  productivityRating: {
    type: Number,
    default: 5
  },
  tomorrowsPlan: {
    type: String
  },
  attachments: [{
    type: String // URL from Cloudinary or local
  }],
  srcFileUrl: {
    type: String
  },
  srcFileName: {
    type: String
  },
  srcFileSize: {
    type: String
  },
  status: {
    type: String,
    enum: ['Submitted', 'Reviewed', 'Approved', 'Rejected', 'Pending'],
    default: 'Submitted'
  },
  teamLeadComments: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DailyReport', dailyReportSchema);

