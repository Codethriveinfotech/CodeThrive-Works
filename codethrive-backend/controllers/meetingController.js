const Meeting = require('../models/Meeting');
const Employee = require('../models/Employee');
const { createNotification } = require('./notificationController');

// @desc    Get my meetings
// @route   GET /api/v1/meetings/my-meetings
// @access  Private (Employee/Admin)
exports.getMyMeetings = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    
    // Find meetings where user is organizer OR employee is in participants
    let query = { organizer: req.user._id };
    
    if (employee) {
      query = {
        $or: [
          { organizer: req.user._id },
          { participants: employee._id }
        ]
      };
    }

    const meetings = await Meeting.find(query)
      .populate('organizer', 'email name')
      .populate('participants', 'fullName profilePhoto designation')
      .sort('date time');

    res.status(200).json({ success: true, count: meetings.length, data: meetings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Schedule a meeting
// @route   POST /api/v1/meetings
// @access  Private
exports.scheduleMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.create({
      ...req.body,
      organizer: req.user._id
    });

    // Notify participants
    if (req.body.participants && req.body.participants.length > 0) {
      const participants = await Employee.find({ _id: { $in: req.body.participants } }).populate('user');
      for (const emp of participants) {
        if (emp.user) {
          await createNotification(
            emp.user._id,
            'New Meeting Invitation',
            `You have been invited to a meeting: ${meeting.title} on ${new Date(meeting.date).toLocaleDateString()} at ${meeting.time}`,
            'Meeting',
            'High',
            '/meetings'
          );
        }
      }
    }

    res.status(201).json({ success: true, data: meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update meeting status/notes
// @route   PUT /api/v1/meetings/:id
// @access  Private
exports.updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    // Only organizer can update
    if (meeting.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updated = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
