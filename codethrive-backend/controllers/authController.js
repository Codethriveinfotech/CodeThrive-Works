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
    let { fullName, employeeId, emailId, phoneNumber, password, role } = req.body;

    // Validate required fields
    if (!fullName || !employeeId || !password) {
      return res.status(400).json({ success: false, message: 'Full Name, Employee ID, and Password are required.' });
    }

    // Validate password (at least 8 characters, uppercase, lowercase, numbers, symbols)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include uppercase, lowercase, numbers, and symbols (@$!%*?&#).'
      });
    }

    // Auto-format email if missing or missing domain
    if (!emailId || !emailId.includes('@')) {
      const cleanId = (employeeId || fullName).toLowerCase().replace(/[^a-z0-9]/g, '');
      emailId = `${cleanId}@codethrive.com`;
    }

    // Auto-format phone if missing
    if (!phoneNumber) {
      phoneNumber = '9876543210';
    }

    // Handle custom typed role/designation
    const customRoleText = role ? role.trim() : 'Employee';
    const lowerRole = customRoleText.toLowerCase();
    
    let userRole = 'employee';
    if (lowerRole.includes('admin') || lowerRole.includes('superadmin')) {
      userRole = 'admin';
    } else if (lowerRole.includes('hr')) {
      userRole = 'hr';
    } else if (lowerRole.includes('lead') || lowerRole.includes('manager') || lowerRole.includes('head')) {
      userRole = 'teamlead';
    } else if (lowerRole.includes('intern')) {
      userRole = 'intern';
    }

    // Check if Employee ID or Email already registered
    let existingUser = await User.findOne({ email: emailId });
    let existingEmployee = await Employee.findOne({ 
      $or: [
        { employeeId },
        { personalEmailAddress: emailId }
      ] 
    });

    if (existingUser || existingEmployee) {
      // Update existing record with new password & details in MongoDB
      if (existingUser) {
        existingUser.password = password;
        existingUser.role = userRole;
        existingUser.status = 'active';
        await existingUser.save();
      } else {
        existingUser = await User.create({
          email: emailId,
          password: password,
          role: userRole,
          status: 'active'
        });
      }

      if (existingEmployee) {
        existingEmployee.user = existingUser._id;
        existingEmployee.fullName = fullName;
        existingEmployee.employeeId = employeeId;
        existingEmployee.designation = customRoleText;
        existingEmployee.personalPhoneNumber = phoneNumber;
        existingEmployee.status = 'Active';
        await existingEmployee.save();
      } else {
        await Employee.create({
          user: existingUser._id,
          fullName: fullName,
          employeeId: employeeId,
          personalEmailAddress: emailId,
          personalPhoneNumber: phoneNumber,
          department: req.body.department || 'Engineering',
          designation: customRoleText,
          dateOfJoining: new Date(),
          status: 'Active'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Account updated & saved in database successfully. Please sign in to continue.'
      });
    }

    // Create New User Account First
    const user = await User.create({
      email: emailId,
      password: password,
      role: userRole,
      status: 'active'
    });

    // Create Employee record linked to User in MongoDB
    await Employee.create({
      user: user._id,
      fullName: fullName,
      employeeId: employeeId,
      personalEmailAddress: emailId,
      personalPhoneNumber: phoneNumber,
      department: req.body.department || 'Engineering',
      designation: customRoleText,
      dateOfJoining: new Date(),
      status: 'Active'
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Account saved in database! Please sign in to continue.'
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Registration error occurred' 
    });
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
      return res.status(400).json({ success: false, message: 'Please provide Employee ID/Email and password' });
    }

    // Find employee by Employee ID or Email
    let employee = await Employee.findOne({ 
      $or: [
        { employeeId: employeeId },
        { personalEmailAddress: employeeId }
      ] 
    }).populate({
      path: 'user',
      select: '+password'
    });

    let user = employee ? employee.user : null;

    // Fallback: search User directly by email if user not linked
    if (!user) {
      user = await User.findOne({ email: employeeId }).select('+password');
      if (user && !employee) {
        employee = await Employee.findOne({ user: user._id });
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this Employee ID or Email. Please register first.' });
    }

    // Prevent Admins from using the Employee login route
    if (user.role === 'admin' || user.role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Admin credentials cannot be used here. Please use the Admin Portal login.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    if (user.status !== 'active') {
      user.status = 'active';
      await user.save();
    }



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

// @desc    Update login email (username)
// @route   PUT /api/v1/auth/update-email
// @access  Private
exports.updateEmail = async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;

    if (!newEmail || !currentPassword) {
      return res.status(400).json({ success: false, message: 'New email and current password are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const existing = await User.findOne({ email: newEmail });
    if (existing && existing._id.toString() !== user._id.toString()) {
      return res.status(400).json({ success: false, message: 'This email is already in use by another account.' });
    }

    user.email = newEmail;
    await user.save();

    // Sync with Employee record
    await Employee.findOneAndUpdate({ user: user._id }, { personalEmailAddress: newEmail });

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

// @desc    Verify employee identity via Employee ID & Phone Number
// @route   POST /api/v1/auth/verify-reset-identity
// @access  Public
exports.verifyResetIdentity = async (req, res) => {
  try {
    const { employeeId, phoneNumber } = req.body;

    if (!employeeId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your Employee ID and registered Phone Number.'
      });
    }

    const trimmedEmpId = employeeId.trim();
    const cleanPhone = phoneNumber.trim();
    const digitsOnly = cleanPhone.replace(/\D/g, '');

    // Search by employeeId (case-insensitive where possible or direct)
    const employee = await Employee.findOne({ employeeId: trimmedEmpId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'No employee account found with this Employee ID.'
      });
    }

    const empPhone = (employee.personalPhoneNumber || employee.personal_phone_number || '').trim();
    const empPhoneDigits = empPhone.replace(/\D/g, '');
    
    // Check match: either exact match or matching last 10 digits
    const isPhoneMatch = (digitsOnly && empPhoneDigits && (empPhoneDigits.endsWith(digitsOnly) || digitsOnly.endsWith(empPhoneDigits))) || empPhone === cleanPhone;

    if (!isPhoneMatch) {
      return res.status(400).json({
        success: false,
        message: 'The phone number does not match our records for this Employee ID.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Identity verified successfully.',
      employee: {
        employeeId: employee.employeeId || employee.employee_id,
        fullName: employee.fullName || employee.full_name
      }
    });
  } catch (err) {
    console.error('verifyResetIdentity error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Reset password using verified Employee ID & Phone Number
// @route   POST /api/v1/auth/reset-password-with-phone
// @access  Public
exports.resetPasswordWithPhone = async (req, res) => {
  try {
    const { employeeId, phoneNumber, newPassword } = req.body;

    if (!employeeId || !phoneNumber || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, Phone Number, and New Password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const trimmedEmpId = employeeId.trim();
    const cleanPhone = phoneNumber.trim();
    const digitsOnly = cleanPhone.replace(/\D/g, '');

    const employee = await Employee.findOne({ employeeId: trimmedEmpId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee account not found.'
      });
    }

    const empPhone = (employee.personalPhoneNumber || employee.personal_phone_number || '').trim();
    const empPhoneDigits = empPhone.replace(/\D/g, '');
    const isPhoneMatch = (digitsOnly && empPhoneDigits && (empPhoneDigits.endsWith(digitsOnly) || digitsOnly.endsWith(empPhoneDigits))) || empPhone === cleanPhone;

    if (!isPhoneMatch) {
      return res.status(400).json({
        success: false,
        message: 'Phone number does not match our records for this Employee ID.'
      });
    }

    // Find linked User
    let user = null;
    if (employee.user_id || employee.user) {
      user = await User.findById(employee.user_id || employee.user);
    }
    const empEmail = (employee.personalEmailAddress || employee.personal_email_address || '').trim();
    if (!user && empEmail) {
      user = await User.findOne({ email: empEmail });
    }

    if (user) {
      user.password = newPassword;
      await user.save();
    } else {
      // If user document didn't exist yet, create one
      user = await User.create({
        email: empEmail || `${employee.employeeId.toLowerCase()}@codethrive.local`,
        password: newPassword,
        role: employee.employmentType === 'Internship' ? 'intern' : 'employee',
        status: 'active'
      });
      employee.user = user._id || user.id;
      employee.user_id = user._id || user.id;
      employee.status = 'Active';
      await employee.save();
    }

    // Notify user of password change
    try {
      const { createNotification } = require('./notificationController');
      await createNotification(
        user._id || user.id,
        'Password Reset Successfully',
        'Your account password was updated using Employee ID and Phone Number verification.',
        'Profile',
        'High',
        '/profile'
      );
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.'
    });
  } catch (err) {
    console.error('resetPasswordWithPhone error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

