const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const User = require('./models/User');
const Employee = require('./models/Employee');
const Attendance = require('./models/Attendance');
const AttendanceCorrection = require('./models/AttendanceCorrection');
const AttendanceSession = require('./models/AttendanceSession');
const DailyReport = require('./models/DailyReport');
const Document = require('./models/Document');
const LeaveRequest = require('./models/LeaveRequest');
const Meeting = require('./models/Meeting');
const Notification = require('./models/Notification');
const Payroll = require('./models/Payroll');
const SupportTicket = require('./models/SupportTicket');
const Task = require('./models/Task');
const TaskActivity = require('./models/TaskActivity');
const Timesheet = require('./models/Timesheet');

const resetFreshDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Wiping all test/demo records from database collections...');
    await Promise.all([
      User.deleteMany({}),
      Employee.deleteMany({}),
      Attendance.deleteMany({}),
      AttendanceCorrection.deleteMany({}),
      AttendanceSession.deleteMany({}),
      DailyReport.deleteMany({}),
      Document.deleteMany({}),
      LeaveRequest.deleteMany({}),
      Meeting.deleteMany({}),
      Notification.deleteMany({}),
      Payroll.deleteMany({}),
      SupportTicket.deleteMany({}),
      Task.deleteMany({}),
      TaskActivity.deleteMany({}),
      Timesheet.deleteMany({})
    ]);

    // Create Fresh Master Admin Account
    const adminUser = await User.create({
      email: 'admin@codethrive.com',
      password: 'Password@123',
      role: 'superadmin',
      status: 'active'
    });

    await Employee.create({
      user: adminUser._id,
      employeeId: 'CTI-ADM-001',
      fullName: 'CodeThrive Admin',
      personalEmailAddress: 'admin@codethrive.com',
      personalPhoneNumber: '+91 78128 64905',
      designation: 'Super Administrator',
      department: 'Management',
      employmentType: 'Full-Time',
      status: 'Active'
    });

    console.log('================================================');
    console.log('✨ DATABASE SUCCESSFULLY RESET TO FRESH STATE! ✨');
    console.log('All test data, test tasks, test reports & employees wiped.');
    console.log('🔑 FRESH ADMIN ACCOUNT:');
    console.log('   Email: admin@codethrive.com');
    console.log('   Password: Password@123');
    console.log('================================================');

    process.exit(0);
  } catch (err) {
    console.error('Reset Error:', err.message);
    process.exit(1);
  }
};

resetFreshDatabase();
