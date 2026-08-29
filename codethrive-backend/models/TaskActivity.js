const mongoose = require('mongoose');

const taskActivitySchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true // e.g., 'Status Changed', 'Progress Updated', 'File Uploaded', 'Comment Added'
  },
  previousValue: String,
  newValue: String,
  comment: String
}, {
  timestamps: true
});

module.exports = mongoose.model('TaskActivity', taskActivitySchema);
