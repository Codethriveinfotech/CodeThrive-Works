const { connectDB } = require('./config/db');
const prisma = require('./config/prisma');
const User = require('./models/User');
const Employee = require('./models/Employee');
const Task = require('./models/Task');
const Attendance = require('./models/Attendance');
const DailyReport = require('./models/DailyReport');
const LeaveRequest = require('./models/LeaveRequest');
const Meeting = require('./models/Meeting');
const Payroll = require('./models/Payroll');
const SupportTicket = require('./models/SupportTicket');

async function migrateAllData() {
  await connectDB();
  console.log('🔄 Migrating all MongoDB records into Neon PostgreSQL...');

  // 1. Users
  const users = await User.find({}).select('+password');
  for (const u of users) {
    const existing = await prisma.users.findUnique({ where: { email: u.email } });
    if (!existing) {
      await prisma.users.create({
        data: {
          email: u.email,
          password: u.password,
          role: u.role || 'employee',
          status: u.status || 'active',
          created_at: u.createdAt || new Date(),
          updated_at: u.updatedAt || new Date()
        }
      });
      console.log(` Migrated user: ${u.email}`);
    }
  }

  // 2. Employees
  const employees = await Employee.find({}).populate('user');
  for (const emp of employees) {
    const existingEmp = await prisma.employees.findFirst({
      where: {
        OR: [
          { employee_id: emp.employeeId || 'TEMP-' + emp._id },
          { personal_email_address: emp.personalEmailAddress }
        ]
      }
    });

    if (!existingEmp) {
      let pgUserId = null;
      if (emp.personalEmailAddress) {
        const u = await prisma.users.findUnique({ where: { email: emp.personalEmailAddress } });
        if (u) pgUserId = u.id;
      }

      await prisma.employees.create({
        data: {
          user_id: pgUserId,
          employee_id: emp.employeeId || 'CTI-EMP-' + Math.floor(100 + Math.random() * 900),
          full_name: emp.fullName || 'Employee',
          personal_email_address: emp.personalEmailAddress,
          personal_phone_number: emp.personalPhoneNumber,
          designation: emp.designation,
          department: emp.department,
          employment_type: emp.employmentType || 'Full-Time',
          work_location: emp.workLocation || 'Office',
          salary_amount: emp.salaryAmount || null,
          salary_type: emp.salaryType || 'Monthly',
          status: emp.status || 'Active',
          created_at: emp.createdAt || new Date(),
          updated_at: emp.updatedAt || new Date()
        }
      });
      console.log(` Migrated employee: ${emp.fullName} (${emp.personalEmailAddress})`);
    }
  }

  console.log('✅ MongoDB to Neon PostgreSQL migration complete!');
  process.exit(0);
}

migrateAllData().catch(e => {
  console.error('Migration error:', e);
  process.exit(1);
});
