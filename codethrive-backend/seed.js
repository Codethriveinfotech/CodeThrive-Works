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

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('Clearing all existing database collections...');
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

    // 1. Create Super Admin User & Employee
    const adminUser = await User.create({
      email: 'admin@codethrive.com',
      password: 'Password@123',
      role: 'superadmin',
      status: 'active'
    });

    const adminEmployee = await Employee.create({
      user: adminUser._id,
      employeeId: 'CTI-ADM-001',
      fullName: 'System Administrator',
      personalEmailAddress: 'admin@codethrive.com',
      personalPhoneNumber: '9998887770',
      designation: 'Super Administrator',
      department: 'Management',
      employmentType: 'Full-Time',
      status: 'Active'
    });

    // 2. Create Employee Users
    const emp1User = await User.create({
      email: 'kiruba@codethrive.com',
      password: 'Password@123',
      role: 'employee',
      status: 'active'
    });

    const emp1 = await Employee.create({
      user: emp1User._id,
      employeeId: 'CTI-2026-001',
      fullName: 'Kirubakaran',
      personalEmailAddress: 'kiruba@codethrive.com',
      personalPhoneNumber: '9876543210',
      designation: 'Senior Full Stack Developer',
      department: 'Engineering',
      employmentType: 'Full-Time',
      workLocation: 'Hybrid',
      dateOfJoining: new Date('2024-01-15'),
      salaryAmount: 85000,
      salaryType: 'Monthly',
      status: 'Active'
    });

    const emp2User = await User.create({
      email: 'saravanan@codethrive.com',
      password: 'Password@123',
      role: 'employee',
      status: 'active'
    });

    const emp2 = await Employee.create({
      user: emp2User._id,
      employeeId: 'CTI-2026-002',
      fullName: 'Saravanan R',
      personalEmailAddress: 'saravanan@codethrive.com',
      personalPhoneNumber: '9876543211',
      designation: 'Frontend UI/UX Specialist',
      department: 'Design & Frontend',
      employmentType: 'Full-Time',
      workLocation: 'Office',
      dateOfJoining: new Date('2024-03-01'),
      salaryAmount: 75000,
      salaryType: 'Monthly',
      status: 'Active'
    });

    const emp3User = await User.create({
      email: 'priya@codethrive.com',
      password: 'Password@123',
      role: 'employee',
      status: 'active'
    });

    const emp3 = await Employee.create({
      user: emp3User._id,
      employeeId: 'CTI-2026-003',
      fullName: 'Priya Dharshini',
      personalEmailAddress: 'priya@codethrive.com',
      personalPhoneNumber: '9876543212',
      designation: 'QA & Automation Engineer',
      department: 'Quality Assurance',
      employmentType: 'Full-Time',
      workLocation: 'Remote',
      dateOfJoining: new Date('2024-05-10'),
      salaryAmount: 65000,
      salaryType: 'Monthly',
      status: 'Active'
    });

    // 3. Seed Tasks
    await Task.create([
      {
        taskId: 'TSK-101',
        title: 'Implement OAuth Authentication & JWT Refresh Tokens',
        description: 'Set up secure user authentication with refresh tokens and cookie security headers.',
        assignedTo: emp1._id,
        assignedBy: adminUser._id,
        priority: 'High',
        status: 'In Progress',
        progressPercentage: 75,
        startDate: new Date('2026-09-01'),
        dueDate: new Date('2026-09-20'),
        estimatedHours: 40,
        actualHours: 28
      },
      {
        taskId: 'TSK-102',
        title: 'Design Glassmorphic Admin Dashboard Theme',
        description: 'Create responsive high-fidelity CSS and modern widgets for executive dashboard.',
        assignedTo: emp2._id,
        assignedBy: adminUser._id,
        priority: 'Medium',
        status: 'Approved',
        progressPercentage: 100,
        startDate: new Date('2026-09-05'),
        dueDate: new Date('2026-09-14'),
        estimatedHours: 24,
        actualHours: 22
      },
      {
        taskId: 'TSK-103',
        title: 'End-to-End API Integration Testing',
        description: 'Write automated test suits for attendance, task creation, and payroll calculations.',
        assignedTo: emp3._id,
        assignedBy: adminUser._id,
        priority: 'Urgent',
        status: 'Ready for Review',
        progressPercentage: 90,
        startDate: new Date('2026-09-10'),
        dueDate: new Date('2026-09-18'),
        estimatedHours: 30,
        actualHours: 26
      }
    ]);

    // 4. Seed Attendance Records
    const today = new Date();
    await Attendance.create([
      {
        employee: emp1._id,
        date: today,
        firstLoginTime: new Date(today.setHours(9, 15, 0)),
        status: 'Working'
      },
      {
        employee: emp2._id,
        date: today,
        firstLoginTime: new Date(today.setHours(9, 30, 0)),
        status: 'Working'
      },
      {
        employee: emp3._id,
        date: today,
        firstLoginTime: new Date(today.setHours(9, 0, 0)),
        status: 'Working'
      }
    ]);

    // 5. Seed Leave Requests
    await LeaveRequest.create([
      {
        employee: emp1._id,
        leaveType: 'Casual Leave',
        startDate: new Date('2026-09-25'),
        endDate: new Date('2026-09-26'),
        reason: 'Family occasion',
        status: 'Pending'
      },
      {
        employee: emp2._id,
        leaveType: 'Sick Leave',
        startDate: new Date('2026-09-02'),
        endDate: new Date('2026-09-03'),
        reason: 'Viral Fever',
        status: 'Approved'
      }
    ]);

    // 6. Seed Meetings
    await Meeting.create([
      {
        title: 'Sprint Planning & Architecture Sync',
        description: 'Weekly team roadmap review and backend scaling discussion.',
        date: new Date('2026-09-16'),
        time: '10:30 AM',
        duration: 45,
        link: 'https://teams.microsoft.com/l/meetup-join/codethrive-sync',
        organizer: adminUser._id,
        participants: [emp1._id, emp2._id, emp3._id]
      },
      {
        title: 'Client Demo & Deliverables Sign-off',
        description: 'Presenting the newly built Portal features to stakeholders.',
        date: new Date('2026-09-18'),
        time: '03:00 PM',
        duration: 60,
        link: 'https://teams.microsoft.com/l/meetup-join/codethrive-demo',
        organizer: adminUser._id,
        participants: [emp1._id, emp2._id]
      }
    ]);

    // 7. Seed Daily Reports
    await DailyReport.create([
      {
        employee: emp1._id,
        date: new Date('2026-09-14'),
        todaysTasks: 'Completed authentication API unit tests and token security headers.',
        challengesFaced: 'None',
        plansForTomorrow: 'Optimize database queries for heavy report aggregation.',
        hoursWorked: 8
      },
      {
        employee: emp2._id,
        date: new Date('2026-09-14'),
        todaysTasks: 'Polished dashboard dark-mode styling and toast animations.',
        challengesFaced: 'Minor responsive alignment issue on mobile screens.',
        plansForTomorrow: 'Finalize profile page layout and photo upload component.',
        hoursWorked: 8
      }
    ]);

    console.log('Database seeded with rich production demo data!');
    console.log('================================================');
    console.log('🔑 ADMIN LOGIN:');
    console.log('   Email: admin@codethrive.com');
    console.log('   Password: Password@123');
    console.log('🔑 EMPLOYEE LOGIN:');
    console.log('   Employee ID / Email: CTI-2026-001 or kiruba@codethrive.com');
    console.log('   Password: Password@123');
    console.log('================================================');

    process.exit(0);
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
};

seedDatabase();
