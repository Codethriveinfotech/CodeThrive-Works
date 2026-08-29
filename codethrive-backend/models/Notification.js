const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  notificationType: {
    type: String,
    enum: [
      'Registration', 'Task', 'Report', 'Leave', 'Attendance', 
      'Meeting', 'Announcement', 'Document', 'Payroll', 'Profile', 
      'Support', 'System'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedModuleId: {
    type: mongoose.Schema.Types.ObjectId
  },
  actionLink: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
