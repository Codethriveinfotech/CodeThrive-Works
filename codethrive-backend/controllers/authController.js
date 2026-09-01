const User = require('../models/User');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

// Helper to send token response
const sendTokenResponse = async (user, statusCode, res) => {
  const token = require('jsonwebtoken').sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  const employee = await Employee.findOne({ user: user._id });

  res.status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        status: user.status,
        name: employee ? employee.fullName : user.email.split('@')[0],
        employeeId: employee ? employee.employeeId : null,
        designation: employee ? employee.designation : null
      }
    });
};

// 1. Employee Registration
exports.registerEmployee = async (req, res) => {
  try {
    const { fullName, employeeId, emailId, phoneNumber, password } = req.body;

    // Validate required fields
    if (!fullName || !employeeId || !emailId || !phoneNumber || !password) {
      return res.status(400).json({ success: false, message: 'All fields are mandatory.' });
    }

    // Check if Employee ID, Email, or Phone already registered
    const existingEmployee = await Employee.findOne({ 
      $or: [
        { employeeId },
        { personalEmailAddress: emailId },
        { personalPhoneNumber: phoneNumber }
      ] 
    });
    
    if (existingEmployee) {
      return res.status(400).json({ success: false, message: 'An account with this Employee ID already exists.' });
    }

    // Create User Account First
    const user = await User.create({
      email: emailId,
      password: password,
      role: 'employee',
      status: 'active'
    });

    // Create Employee record linked to User
    const newEmployee = await Employee.create({
      user: user._id,
      fullName: fullName,
      employeeId: employeeId,
      personalEmailAddress: emailId,
      personalPhoneNumber: phoneNumber,
      status: 'Active'
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please sign in to continue.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Admin Approves Employee (Generates Employee ID)
exports.approveEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (employee.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Employee is not in Pending status' });
    }

    // Generate Employee ID: CTI-YYYY-XXX
    const year = new Date().getFullYear();
    const count = await Employee.countDocuments({ status: { $in: ['Approved', 'Active'] } });
    const serial = String(count + 1).padStart(3, '0');
    const employeeId = `CTI-${year}-${serial}`;

    employee.status = 'Approved';
    employee.employeeId = req.body.manualEmployeeId || employeeId;
    
    await employee.save();

    res.status(200).json({
      success: true,
      message: `Employee approved. ID Generated: ${employee.employeeId}`,
      data: employee
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Employee Creates Credentials (Mock OTP Flow)
exports.createCredentials = async (req, res) => {
  try {
    const { employeeId, emailOrPhone, otp, password } = req.body;

    // MOCK OTP VALIDATION
    if (otp !== '123456') {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const employee = await Employee.findOne({ 
      employeeId, 
      $or: [{ personalEmailAddress: emailOrPhone }, { personalPhoneNumber: emailOrPhone }] 
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Invalid Employee ID or contact details' });
    }

    if (employee.status !== 'Approved') {
      return res.status(400).json({ success: false, message: 'Account is not approved for credential creation' });
    }

    if (employee.user) {
      return res.status(400).json({ success: false, message: 'Credentials already created for this account' });
    }

    // Password Validation (Regex: Min 8, 1 uppercase, 1 lowercase, 1 number, 1 special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.' 
      });
    }

    // Create User Account
    const user = await User.create({
      email: employee.personalEmailAddress,
      password,
      role: employee.employmentType === 'Internship' ? 'intern' : 'employee',
      status: 'active'
    });

    // Link User to Employee and activate
    employee.user = user._id;
    employee.status = 'Active';
    await employee.save();

    res.status(201).json({
      success: true,
      message: 'Credentials created successfully. You can now log in.'
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Employee Login
exports.login = async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res.status(400).json({ success: false, message: 'Please provide Employee ID and password' });
    }

    // Find employee by Employee ID and populate linked user
    const employee = await Employee.findOne({ employeeId: employeeId }).populate({
      path: 'user',
      select: '+password'
    });

    if (!employee || !employee.user) {
      return res.status(404).json({ success: false, message: 'No account found with this Employee ID. Please register first.' });
    }

    const user = employee.user;

    // Prevent Admins from using the Employee login route
    if (user.role === 'admin' || user.role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Admin credentials cannot be used here. Please use the Admin Portal login.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: `Account is ${user.status}. Contact Admin.` });
    }

    // --- ATTENDANCE TRACKING ON LOGIN ---
    try {
      if (employee) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of day

        let attendance = await Attendance.findOne({
          employee: employee._id,
          date: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        });

        if (!attendance) {
          await Attendance.create({
            employee: employee._id,
            date: new Date(),
            firstLoginTime: new Date(),
            status: 'Working'
          });
        } else if (attendance.status === 'Checked Out' || attendance.status === 'Not Checked In') {
          attendance.status = 'Working';
          await attendance.save();
        }
      }
    } catch (attError) {
      console.warn('Attendance tracking skipped due to DB error or missing record', attError.message);
    }
    // ------------------------------------

    await sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4.5 Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide Email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Invalid Admin credentials' });
    }

    if (user.role !== 'admin' && user.role !== 'superadmin' && user.role !== 'hr') {
      return res.status(403).json({ success: false, message: 'Access denied. You do not have Admin privileges.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: `Account is ${user.status}. Contact Super Admin.` });
    }

    await sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    if (req.user) {
      const employeeData = await Employee.findOne({ user: req.user.id });
      if (employeeData) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let attendance = await Attendance.findOne({
          employee: employeeData._id,
          date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
        });

        if (attendance) {
          attendance.lastLogoutTime = new Date();
          attendance.status = 'Checked Out';
          
          // Calculate total duration in seconds based on firstLogin and lastLogout
          // In a real app we might sum up sessions. Here we do simple diff.
          if (attendance.firstLoginTime) {
            const diff = Math.floor((attendance.lastLogoutTime.getTime() - attendance.firstLoginTime.getTime()) / 1000);
            attendance.totalWorkDurationInSeconds = diff;
          }
          await attendance.save();
        }
      }
    }
  } catch (err) {
    console.warn('Error saving logout attendance', err.message);
  }

  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.' 
      });
    }

    user.password = newPassword;
    await user.save();

    const { createNotification } = require('./notificationController');
    await createNotification(user._id, 'Password Changed', 'Your account password has been successfully updated.', 'Profile', 'High', '/profile');

    await sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
