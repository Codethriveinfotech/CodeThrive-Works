const DailyReport = require('../models/DailyReport');
const Employee = require('../models/Employee');
const { createNotification } = require('./notificationController');

// @desc    Submit a daily report
// @route   POST /api/v1/daily-reports
// @access  Private (Employee)
exports.submitReport = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    let attachmentUrl = null;
    if (req.file) {
      attachmentUrl = req.file.path;
    }

    const report = await DailyReport.create({
      ...req.body,
      employee: employee._id,
      attachments: attachmentUrl ? [attachmentUrl] : []
    });

    if (employee.reportingManager) {
      const manager = await Employee.findById(employee.reportingManager);
      if (manager && manager.user) {
        await createNotification(
          manager.user,
          'New Daily Report',
          `${employee.fullName} submitted their daily report.`,
          'Report',
          'Medium',
          '/reports'
        );
      }
    }

    res.status(201).json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get my daily reports
// @route   GET /api/v1/daily-reports/my-reports
// @access  Private (Employee)
exports.getMyReports = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    const reports = await DailyReport.find({ employee: employee._id }).sort('-date');
    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update my daily report (if not yet reviewed)
// @route   PUT /api/v1/daily-reports/:id
// @access  Private (Employee)
exports.updateReport = async (req, res) => {
  try {
    let report = await DailyReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    const employee = await Employee.findOne({ user: req.user._id });
    if (report.employee.toString() !== employee._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (report.status === 'Reviewed') {
      return res.status(400).json({ success: false, message: 'Cannot edit a reviewed report' });
    }

    if (req.file) {
      req.body.attachments = [...report.attachments, req.file.path];
    }

    report = await DailyReport.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    res.status(200).json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all daily reports
// @route   GET /api/v1/daily-reports
// @access  Private (Admin/HR/TeamLead)
exports.getAllReports = async (req, res) => {
  try {
    const reports = await DailyReport.find().populate('employee', 'fullName employeeId department').sort('-date');
    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
