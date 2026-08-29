const SupportTicket = require('../models/SupportTicket');
const Employee = require('../models/Employee');
const { createNotification } = require('./notificationController');

// @desc    Create a support ticket
// @route   POST /api/v1/support
// @access  Private
exports.createTicket = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const count = await SupportTicket.countDocuments();
    const ticketId = `TKT-${String(count + 1001).padStart(4, '0')}`;

    let attachmentUrl = null;
    if (req.file) {
      attachmentUrl = req.file.path;
    }

    const ticket = await SupportTicket.create({
      ...req.body,
      ticketId,
      employee: employee._id,
      attachments: attachmentUrl ? [attachmentUrl] : []
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get my support tickets
// @route   GET /api/v1/support/my-tickets
// @access  Private
exports.getMyTickets = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const tickets = await SupportTicket.find({ employee: employee._id }).sort('-createdAt');
    res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
