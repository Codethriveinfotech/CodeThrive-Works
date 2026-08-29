const Document = require('../models/Document');
const Employee = require('../models/Employee');

// @desc    Upload a document
// @route   POST /api/v1/documents
// @access  Private (Employee/Admin)
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const { title, documentType, isPublic } = req.body;
    let ownerId = null;

    if (!isPublic || isPublic === 'false') {
      const employee = await Employee.findOne({ user: req.user._id });
      if (employee) ownerId = employee._id;
    }

    const doc = await Document.create({
      title,
      documentType,
      owner: ownerId,
      uploadedBy: req.user._id,
      fileUrl: req.file.path,
      isPublic: isPublic === 'true'
    });

    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get my documents (and public policies)
// @route   GET /api/v1/documents
// @access  Private
exports.getDocuments = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    
    let query = {
      $or: [
        { isPublic: true }
      ]
    };
    
    if (employee) {
      query.$or.push({ owner: employee._id });
    }

    // Admin can see everything if they want, but let's keep it simple: Employee gets their docs + public
    if (['admin', 'superadmin', 'hr'].includes(req.user.role)) {
      query = {}; // Admin sees all docs
    }

    const docs = await Document.find(query).populate('owner', 'fullName employeeId').sort('-createdAt');
    res.status(200).json({ success: true, count: docs.length, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete document
// @route   DELETE /api/v1/documents/:id
// @access  Private
exports.deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    // Only uploader or admin can delete
    if (doc.uploadedBy.toString() !== req.user._id.toString() && !['admin', 'superadmin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Document.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
