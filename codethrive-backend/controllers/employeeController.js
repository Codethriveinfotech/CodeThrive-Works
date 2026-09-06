const User = require('../models/User');
const Employee = require('../models/Employee');

// @desc    Get all employees
// @route   GET /api/v1/employees
// @access  Private (Admin/HR/TeamLead)
exports.getEmployees = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'teamlead') {
      // Find the employee doc for this user to get their _id
      const currentUserEmp = await Employee.findOne({ user: req.user._id });
      if (currentUserEmp) {
        query.reportingManager = currentUserEmp._id;
      } else {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
    }
    
    const employees = await Employee.find(query).populate('user', 'email role status');
    res.status(200).json({ success: true, count: employees.length, data: employees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Add new employee directly (Admin)
exports.addEmployee = async (req, res) => {
  try {
    const { personalEmailAddress, personalPhoneNumber, fullName } = req.body;
    const existingEmployee = await Employee.findOne({ $or: [{ personalEmailAddress }, { personalPhoneNumber }] });
    if (existingEmployee) {
      return res.status(400).json({ success: false, message: 'Email or Phone already exists' });
    }
    
    const year = new Date().getFullYear();
    const count = await Employee.countDocuments();
    const employeeId = `CTI-${year}-${String(count + 1).padStart(3, '0')}`;
    
    const newEmployee = await Employee.create({
      ...req.body,
      employeeId,
      status: 'Active'
    });
    
    res.status(201).json({ success: true, data: newEmployee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single employee
// @route   GET /api/v1/employees/:id
// @access  Private
exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('user', 'email role status');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // RBAC: If employee/intern, can only view self
    if (['employee', 'intern'].includes(req.user.role)) {
      if (employee.user?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this profile' });
      }
    }

    res.status(200).json({ success: true, data: employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get current logged in employee profile
// @route   GET /api/v1/employees/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    let employee = await Employee.findOne({ user: req.user._id }).populate('user', 'email role status');
    if (!employee) {
      // Auto-create profile for Admin/User if missing
      const isManagement = ['superadmin', 'admin', 'hr'].includes(req.user.role);
      const roleTitle = req.user.role === 'superadmin' ? 'Super Administrator' : (req.user.role === 'admin' ? 'Administrator' : 'HR Manager');
      const defaultName = req.user.email ? req.user.email.split('@')[0].toUpperCase() : 'ADMINISTRATOR';

      employee = await Employee.create({
        user: req.user._id,
        employeeId: isManagement ? `CTI-ADM-001` : `CTI-EMP-001`,
        fullName: isManagement ? 'System Administrator' : defaultName,
        personalEmailAddress: req.user.email,
        personalPhoneNumber: '9876543210',
        designation: roleTitle,
        department: isManagement ? 'System Administration & Management' : 'Engineering',
        employmentType: 'Full-Time',
        status: 'Active',
        workLocation: 'Office'
      });
      employee = await Employee.findById(employee._id).populate('user', 'email role status');
    }
    res.status(200).json({ success: true, data: employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update employee details
// @route   PUT /api/v1/employees/:id
// @access  Private (Admin/HR)
exports.updateEmployee = async (req, res) => {
  try {
    let employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Handle photo upload if exists
    if (req.file) {
      req.body.profilePhoto = req.file.path; // Cloudinary URL
    }

    employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete employee
// @route   DELETE /api/v1/employees/:id
// @access  Private (SuperAdmin/Admin)
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Delete associated user account
    if (employee.user) {
      await User.findByIdAndDelete(employee.user);
    }
    await employee.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update current employee profile (limited fields)
// @route   PUT /api/v1/employees/me
// @access  Private
exports.updateMe = async (req, res) => {
  try {
    let employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      const isManagement = ['superadmin', 'admin', 'hr'].includes(req.user.role);
      const roleTitle = req.user.role === 'superadmin' ? 'Super Administrator' : (req.user.role === 'admin' ? 'Administrator' : 'HR Manager');
      employee = await Employee.create({
        user: req.user._id,
        employeeId: isManagement ? `CTI-ADM-001` : `CTI-EMP-001`,
        fullName: req.body.fullName || (isManagement ? 'System Administrator' : 'User'),
        personalEmailAddress: req.user.email,
        personalPhoneNumber: req.body.personalPhoneNumber || '9876543210',
        designation: roleTitle,
        department: isManagement ? 'System Administration & Management' : 'Engineering',
        status: 'Active'
      });
    }

    const updateFields = [
      'fullName', 'profilePhoto', 'dateOfBirth', 'gender', 'bloodGroup',
      'personalPhoneNumber', 'personalEmailAddress', 'currentAddress', 'permanentAddress',
      'emergencyContact', 'department', 'designation', 'employmentType', 'dateOfJoining',
      'workLocation', 'reportingManager', 'qualification', 'collegeName', 'graduationYear',
      'previousCompany', 'totalExperience', 'skills', 'technologyKnowledge'
    ];

    const updateData = {};
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Handle photo upload if file exists
    if (req.file) {
      updateData.profilePhoto = req.file.path;
    }

    employee = await Employee.findByIdAndUpdate(employee._id, updateData, {
      new: true,
      runValidators: true
    });

    // Sync email with User model if personalEmailAddress changed
    if (updateData.personalEmailAddress) {
      await User.findByIdAndUpdate(req.user._id, { email: updateData.personalEmailAddress });
    }

    res.status(200).json({ success: true, data: employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
