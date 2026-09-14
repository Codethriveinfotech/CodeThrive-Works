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

const resetAllData = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Clearing all registered employee and transactional data...');
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

    console.log('Creating initial Super Admin account...');
    await User.create({
      email: 'admin@codethrive.com',
      password: 'Password@123',
      role: 'superadmin',
      status: 'active'
    });

    console.log('SUCCESS: All registered details have been completely removed!');
    console.log('System is now fresh and ready for new registrations and usage.');
    console.log('Default Super Admin Login:');
    console.log('Email: admin@codethrive.com');
    console.log('Password: Password@123');

    process.exit(0);
  } catch (err) {
    console.error('ERROR resetting database:', err);
    process.exit(1);
  }
};

resetAllData();
