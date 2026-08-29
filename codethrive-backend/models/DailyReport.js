const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
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
  tomorrowsPlan: {
    type: String
  },
  attachments: [{
    type: String // URL from Cloudinary or local
  }],
  status: {
    type: String,
    enum: ['Submitted', 'Reviewed', 'Rejected'],
    default: 'Submitted'
  },
  teamLeadComments: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DailyReport', dailyReportSchema);
