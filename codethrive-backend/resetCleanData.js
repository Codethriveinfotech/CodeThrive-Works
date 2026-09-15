const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const User = require('./models/User');
const Employee = require('./models/Employee');
const Attendance = require('./models/Attendance');
const AttendanceSession = require('./models/AttendanceSession');
const Task = require('./models/Task');
const DailyReport = require('./models/DailyReport');
const Notification = require('./models/Notification');
const LeaveRequest = require('./models/LeaveRequest');

const resetDatabase = async () => {
  try {
    await connectDB();
    console.log('Connected to Database for Fresh Reset...');

    // 1. Wipe out existing collections
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Attendance.deleteMany({});
    await AttendanceSession.deleteMany({});
    await Task.deleteMany({});
    await DailyReport.deleteMany({});
    await Notification.deleteMany({});
    await LeaveRequest.deleteMany({});

    console.log('All previous dummy data, attendance logs, tasks, and users removed.');

    // 2. Create Single Fresh Master Admin User
    const adminUser = await User.create({
      email: 'admin@codethrive.com',
      password: 'Password@123',
      role: 'admin',
      status: 'active'
    });

    // 3. Create Admin Employee Record
    await Employee.create({
      user: adminUser._id,
      employeeId: 'CTI-ADM-001',
      fullName: 'CodeThrive Administrator',
      companyEmailAddress: 'admin@codethrive.com',
      personalEmailAddress: 'admin@codethrive.com',
      personalPhoneNumber: '+91 78128 64905',
      department: 'Management',
      designation: 'System Administrator & CTO',
      employmentType: 'Full-Time',
      status: 'Active',
      dateOfJoining: new Date(),
      workLocation: 'Office'
    });

    console.log('Fresh Master Admin Account Created: admin@codethrive.com / Password@123');
    console.log('Database is now completely clean and ready for real new registrations!');
    process.exit(0);
  } catch (err) {
    console.error('Reset Error:', err);
    process.exit(1);
  }
};

resetDatabase();
