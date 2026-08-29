const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskId: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: [
      'Assigned', 'Not Started', 'In Progress', 'On Hold', 'Blocked', 
      'Ready for Review', 'Changes Requested', 'Completed', 'Approved', 
      'Rejected', 'Cancelled'
    ],
    default: 'Assigned'
  },
  progressPercentage: {
    type: Number,
    enum: [0, 10, 25, 50, 75, 90, 100],
    default: 0
  },
  startDate: Date,
  dueDate: Date,
  dueTime: String,
  estimatedHours: Number,
  actualHours: {
    type: Number,
    default: 0
  },
  attachments: [String],
  links: {
    github: String,
    deployment: String,
    document: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
