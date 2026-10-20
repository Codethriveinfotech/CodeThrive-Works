const DailyReport = require('../models/DailyReport');
const Employee = require('../models/Employee');
const { createNotification } = require('./notificationController');
const path = require('path');
const fs = require('fs');


// Helper to format file size
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// @desc    Submit a daily report with optional SRC file upload
// @route   POST /api/v1/daily-reports
// @access  Private (Employee)
exports.submitReport = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    let attachmentUrl = null;
    let srcFileUrl = null;
    let srcFileName = null;
    let srcFileSize = null;

    // Check single file or multiple files from multer
    const uploadedFile = req.file || (req.files && (req.files.srcFile?.[0] || req.files.attachment?.[0] || req.files[0]));
    if (uploadedFile) {
      if (uploadedFile.path && (uploadedFile.path.startsWith('http://') || uploadedFile.path.startsWith('https://'))) {
        srcFileUrl = uploadedFile.path;
      } else {
        srcFileUrl = `/uploads/${uploadedFile.filename}`;
      }
      attachmentUrl = srcFileUrl;
      srcFileName = uploadedFile.originalname;
      srcFileSize = formatFileSize(uploadedFile.size);
    }

    // Direct url/name fallback from request body
    if (!srcFileUrl && req.body.srcFileUrl) {
      srcFileUrl = req.body.srcFileUrl;
      srcFileName = req.body.srcFileName || 'source_code.zip';
      srcFileSize = req.body.srcFileSize || 'File attached';
      attachmentUrl = srcFileUrl;
    }

    const reportData = {
      ...req.body,
      employee: employee._id,
      attachments: attachmentUrl ? [attachmentUrl] : (req.body.attachments || []),
      srcFileUrl: srcFileUrl,
      srcFileName: srcFileName,
      srcFileSize: srcFileSize,
      status: req.body.status || 'Submitted'
    };

    const createdReport = await DailyReport.create(reportData);
    const populatedReport = await DailyReport.findById(createdReport._id)
      .populate('employee', 'fullName employeeId department designation');

    if (employee.reportingManager) {
      const manager = await Employee.findById(employee.reportingManager);
      if (manager && manager.user) {
        await createNotification(
          manager.user,
          'New Daily Work Report',
          `${employee.fullName} submitted worklog${srcFileName ? ` with SRC file (${srcFileName})` : ''}.`,
          'Report',
          'Medium',
          '/admin/reports'
        );
      }
    }

    res.status(201).json({ success: true, data: populatedReport || createdReport });
  } catch (err) {
    console.error('Submit report error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get my daily reports
// @route   GET /api/v1/daily-reports/my-reports
// @access  Private (Employee)
exports.getMyReports = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const reports = await DailyReport.find({ employee: employee._id }).sort('-date -createdAt');
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

    if (['Reviewed', 'Approved'].includes(report.status)) {
      return res.status(400).json({ success: false, message: 'Cannot edit an approved/reviewed report' });
    }

    const uploadedFile = req.file || (req.files && (req.files.srcFile?.[0] || req.files.attachment?.[0] || req.files[0]));
    if (uploadedFile) {
      const fileUrl = (uploadedFile.path && (uploadedFile.path.startsWith('http://') || uploadedFile.path.startsWith('https://'))) 
        ? uploadedFile.path 
        : `/uploads/${uploadedFile.filename}`;
      req.body.srcFileUrl = fileUrl;
      req.body.srcFileName = uploadedFile.originalname;
      req.body.srcFileSize = formatFileSize(uploadedFile.size);
      req.body.attachments = [...(report.attachments || []), fileUrl];
    }

    report = await DailyReport.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('employee', 'fullName employeeId department designation');

    res.status(200).json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Review / Approve / Reject report (Admin/HR/TeamLead)
// @route   PUT /api/v1/daily-reports/:id/review
// @access  Private (Admin/HR/TeamLead)
exports.reviewReport = async (req, res) => {
  try {
    const { status, teamLeadComments } = req.body;
    let report = await DailyReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    const updateFields = {};
    if (status) updateFields.status = status;
    if (teamLeadComments !== undefined) updateFields.teamLeadComments = teamLeadComments;

    report = await DailyReport.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true })
      .populate('employee', 'fullName employeeId department designation');

    // Notify employee of review decision
    if (report.employee) {
      const emp = await Employee.findById(report.employee._id || report.employee);
      if (emp && emp.user) {
        await createNotification(
          emp.user,
          `Work Report ${status || 'Reviewed'}`,
          `Your daily work report was marked as ${status || 'Reviewed'}.`,
          'Report',
          'Low',
          '/employee/reports'
        );
      }
    }

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
    const reports = await DailyReport.find()
      .populate('employee', 'fullName employeeId department designation profilePhoto')
      .sort('-date -createdAt');
    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Download SRC file with attachment headers
// @route   GET /api/v1/daily-reports/:id/download-src
// @access  Private
exports.downloadSrcFile = async (req, res) => {
  try {
    const report = await DailyReport.findById(req.params.id);
    if (!report || !report.srcFileUrl) {
      return res.status(404).json({ success: false, message: 'Source file not found' });
    }

    if (report.srcFileUrl.startsWith('http://') || report.srcFileUrl.startsWith('https://')) {
      return res.redirect(report.srcFileUrl);
    }

    const localPath = path.join(__dirname, '..', report.srcFileUrl);
    if (!fs.existsSync(localPath)) {
      return res.status(404).json({ success: false, message: 'File not found on server disk' });
    }

    const downloadName = report.srcFileName || path.basename(localPath);
    res.download(localPath, downloadName);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


