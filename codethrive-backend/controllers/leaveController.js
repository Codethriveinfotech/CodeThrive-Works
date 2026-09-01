const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');

// Default allocations (Can be moved to DB settings later)
const LEAVE_ALLOCATIONS = {
  Casual: 12,
  Sick: 12,
  Paid: 24
};

// @desc    Get Employee Leave Balance & History
// @route   GET /api/v1/leaves/my-leaves
// @access  Private (Employee)
exports.getMyLeaves = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const requests = await LeaveRequest.find({ employee: employee._id }).sort({ createdAt: -1 });
    
    // Calculate dynamically based on approved leaves
    let usedCasual = 0;
    let usedSick = 0;
    let usedPaid = 0;

    requests.forEach(req => {
      if (req.status === 'Approved') {
        const days = Math.round((new Date(req.endDate) - new Date(req.startDate)) / (1000 * 60 * 60 * 24)) + 1;
        if (req.leaveType === 'Casual') usedCasual += days;
        if (req.leaveType === 'Sick') usedSick += days;
        if (req.leaveType === 'Paid') usedPaid += days;
      }
    });

    const summary = {
      casualLeaveBalance: Math.max(0, LEAVE_ALLOCATIONS.Casual - usedCasual),
      sickLeaveBalance: Math.max(0, LEAVE_ALLOCATIONS.Sick - usedSick),
      paidLeaveBalance: Math.max(0, LEAVE_ALLOCATIONS.Paid - usedPaid),
      totalAvailable: Math.max(0, LEAVE_ALLOCATIONS.Casual - usedCasual) + Math.max(0, LEAVE_ALLOCATIONS.Sick - usedSick) + Math.max(0, LEAVE_ALLOCATIONS.Paid - usedPaid),
      usedLeave: usedCasual + usedSick + usedPaid,
      pendingRequests: requests.filter(r => r.status === 'Pending').length,
      requests
    };

    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Apply Leave
// @route   POST /api/v1/leaves
// @access  Private (Employee)
exports.applyLeave = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ success: false, message: 'End date cannot be earlier than start date' });
    }

    const leave = await LeaveRequest.create({
      employee: employee._id,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: 'Pending'
    });

    res.status(201).json({ success: true, data: leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get All Leaves (Admin)
// @route   GET /api/v1/leaves
// @access  Private (Admin)
exports.getAllLeaves = async (req, res) => {
  try {
    const { status, leaveType } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;

    const leaves = await LeaveRequest.find(query)
      .populate('employee', 'fullName employeeId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: leaves.length, data: leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update Leave Status (Admin)
// @route   PUT /api/v1/leaves/:id
// @access  Private (Admin)
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    let leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

    leave.status = status;
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    
    await leave.save();
    
    // Return populated leave for frontend update
    leave = await LeaveRequest.findById(req.params.id).populate('employee', 'fullName employeeId');

    res.status(200).json({ success: true, data: leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
