const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function setupNeonPostgres() {
  try {
    console.log('Connecting to Neon PostgreSQL Cloud Database...');
    await client.connect();
    console.log('Connected successfully!');

    console.log('Creating 15 relational tables in Neon PostgreSQL...');

    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'employee',
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS employees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        employee_id VARCHAR(100) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        personal_email_address VARCHAR(255),
        personal_phone_number VARCHAR(50),
        designation VARCHAR(150),
        department VARCHAR(150),
        employment_type VARCHAR(50),
        work_location VARCHAR(100),
        date_of_joining TIMESTAMP WITH TIME ZONE,
        salary_amount NUMERIC(12,2),
        salary_type VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS attendances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        first_login_time TIMESTAMP WITH TIME ZONE,
        last_logout_time TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) DEFAULT 'Working',
        total_work_minutes INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS attendance_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        attendance_id UUID NOT NULL REFERENCES attendances(id) ON DELETE CASCADE,
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        session_type VARCHAR(50) DEFAULT 'Work',
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE,
        duration_in_seconds INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Active',
        force_close_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS attendance_corrections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        reason TEXT NOT NULL,
        attachment TEXT,
        requested_checkout_time VARCHAR(20),
        status VARCHAR(50) DEFAULT 'Pending',
        approved_by UUID REFERENCES users(id),
        approved_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS leave_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        leave_type VARCHAR(50) NOT NULL,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        approved_by UUID REFERENCES users(id),
        approved_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS daily_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        tasks_worked TEXT NOT NULL,
        work_summary TEXT NOT NULL,
        hours_worked NUMERIC(5,2) NOT NULL,
        completed_work TEXT,
        pending_work TEXT,
        issues_faced TEXT,
        tomorrows_plan TEXT,
        status VARCHAR(50) DEFAULT 'Submitted',
        team_lead_comments TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS meetings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        agenda TEXT NOT NULL,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        time VARCHAR(50) NOT NULL,
        meeting_link TEXT,
        organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Scheduled',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payrolls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        payslip_id VARCHAR(100) UNIQUE NOT NULL,
        month VARCHAR(50) NOT NULL,
        basic_salary NUMERIC(12,2) NOT NULL,
        allowances NUMERIC(12,2) DEFAULT 0,
        bonus NUMERIC(12,2) DEFAULT 0,
        deductions NUMERIC(12,2) DEFAULT 0,
        gross_salary NUMERIC(12,2) NOT NULL,
        net_payable NUMERIC(12,2) NOT NULL,
        payment_date TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) DEFAULT 'Paid',
        hra NUMERIC(12,2) DEFAULT 0,
        travel NUMERIC(12,2) DEFAULT 0,
        medical NUMERIC(12,2) DEFAULT 0,
        pf NUMERIC(12,2) DEFAULT 0,
        income_tax NUMERIC(12,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id VARCHAR(100) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        assigned_to_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        assigned_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        priority VARCHAR(50) DEFAULT 'Medium',
        status VARCHAR(50) DEFAULT 'Assigned',
        progress_percentage INT DEFAULT 0,
        start_date TIMESTAMP WITH TIME ZONE,
        due_date TIMESTAMP WITH TIME ZONE,
        estimated_hours NUMERIC(6,2),
        actual_hours NUMERIC(6,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS task_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(255) NOT NULL,
        previous_value TEXT,
        new_value TEXT,
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS timesheets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        task TEXT NOT NULL,
        hours NUMERIC(5,2) NOT NULL,
        date VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id VARCHAR(100) UNIQUE NOT NULL,
        subject VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'IT Support',
        priority VARCHAR(50) DEFAULT 'Medium',
        description TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Open',
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        assigned_to_id UUID REFERENCES users(id),
        resolution TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        document_type VARCHAR(100) DEFAULT 'Other',
        owner_id UUID REFERENCES employees(id),
        uploaded_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        file_url TEXT NOT NULL,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        notification_type VARCHAR(100) NOT NULL,
        priority VARCHAR(50) DEFAULT 'Low',
        is_read BOOLEAN DEFAULT FALSE,
        related_module_id UUID,
        action_link TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Tables created successfully!');

    // Clean existing records to avoid duplicates on re-run
    await client.query(`
      TRUNCATE TABLE 
        notifications, documents, support_tickets, timesheets, task_activities, tasks,
        payrolls, meetings, daily_reports, leave_requests, attendance_corrections,
        attendance_sessions, attendances, employees, users
      CASCADE;
    `);

    console.log('Seeding initial production data into Neon PostgreSQL...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password@123', salt);

    // 1. Admin User & Employee
    const adminUserRes = await client.query(`
      INSERT INTO users (email, password, role, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `, ['admin@codethrive.com', hashedPassword, 'superadmin', 'active']);
    const adminUserId = adminUserRes.rows[0].id;

    const adminEmpRes = await client.query(`
      INSERT INTO employees (user_id, employee_id, full_name, personal_email_address, personal_phone_number, designation, department, employment_type, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id;
    `, [adminUserId, 'CTI-ADM-001', 'System Administrator', 'admin@codethrive.com', '9998887770', 'Super Administrator', 'Management', 'Full-Time', 'Active']);
    const adminEmpId = adminEmpRes.rows[0].id;

    // 2. Employee 1 User & Employee
    const emp1UserRes = await client.query(`
      INSERT INTO users (email, password, role, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `, ['kiruba@codethrive.com', hashedPassword, 'employee', 'active']);
    const emp1UserId = emp1UserRes.rows[0].id;

    const emp1Res = await client.query(`
      INSERT INTO employees (user_id, employee_id, full_name, personal_email_address, personal_phone_number, designation, department, employment_type, work_location, salary_amount, salary_type, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id;
    `, [emp1UserId, 'CTI-2026-001', 'Kirubakaran', 'kiruba@codethrive.com', '9876543210', 'Senior Full Stack Developer', 'Engineering', 'Full-Time', 'Hybrid', 85000, 'Monthly', 'Active']);
    const emp1Id = emp1Res.rows[0].id;

    // 3. Employee 2 User & Employee
    const emp2UserRes = await client.query(`
      INSERT INTO users (email, password, role, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `, ['saravanan@codethrive.com', hashedPassword, 'employee', 'active']);
    const emp2UserId = emp2UserRes.rows[0].id;

    const emp2Res = await client.query(`
      INSERT INTO employees (user_id, employee_id, full_name, personal_email_address, personal_phone_number, designation, department, employment_type, work_location, salary_amount, salary_type, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id;
    `, [emp2UserId, 'CTI-2026-002', 'Saravanan R', 'saravanan@codethrive.com', '9876543211', 'Frontend UI/UX Specialist', 'Design & Frontend', 'Full-Time', 'Office', 75000, 'Monthly', 'Active']);
    const emp2Id = emp2Res.rows[0].id;

    // 4. Tasks
    const task1Res = await client.query(`
      INSERT INTO tasks (task_id, title, description, assigned_to_id, assigned_by_id, priority, status, progress_percentage, estimated_hours, actual_hours)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id;
    `, ['TSK-101', 'Implement Neon PostgreSQL Migration', 'Migrate database from MongoDB to Neon PostgreSQL database.', emp1Id, adminUserId, 'High', 'In Progress', 85, 40, 32]);
    const task1Id = task1Res.rows[0].id;

    // 5. Attendance
    const attRes = await client.query(`
      INSERT INTO attendances (employee_id, date, first_login_time, status)
      VALUES ($1, NOW(), NOW(), 'Working')
      RETURNING id;
    `, [emp1Id]);
    const attId = attRes.rows[0].id;

    // 6. Attendance Session
    await client.query(`
      INSERT INTO attendance_sessions (attendance_id, employee_id, session_type, start_time, duration_in_seconds, status)
      VALUES ($1, $2, 'Work', NOW(), 28800, 'Completed');
    `, [attId, emp1Id]);

    // 7. Leave Request
    await client.query(`
      INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status)
      VALUES ($1, 'Casual', NOW() + interval '5 days', NOW() + interval '6 days', 'Personal work', 'Pending');
    `, [emp1Id]);

    // 8. Meeting
    await client.query(`
      INSERT INTO meetings (title, agenda, date, time, meeting_link, organizer_id, status)
      VALUES ($1, $2, NOW() + interval '1 day', '10:30 AM', 'https://teams.microsoft.com/l/meetup-join/codethrive-sync', $3, 'Scheduled');
    `, ['Sprint Planning & Architecture Sync', 'Weekly roadmap review and database scaling discussion.', adminUserId]);

    // 9. Daily Report
    await client.query(`
      INSERT INTO daily_reports (employee_id, tasks_worked, work_summary, hours_worked, completed_work, tomorrows_plan)
      VALUES ($1, $2, $3, $4, $5, $6);
    `, [emp1Id, 'Completed Neon PostgreSQL setup script', 'Configured PostgreSQL connection and table schemas', 8, 'PostgreSQL Database Integration', 'Build Postgres controllers']);

    // 10. Payroll
    await client.query(`
      INSERT INTO payrolls (employee_id, payslip_id, month, basic_salary, allowances, deductions, gross_salary, net_payable, status)
      VALUES ($1, 'PAY-2026-09-001', 'September 2026', 50000, 35000, 5000, 85000, 80000, 'Paid');
    `, [emp1Id]);

    // 11. Timesheet
    await client.query(`
      INSERT INTO timesheets (employee_id, task, hours, date)
      VALUES ($1, 'Neon PostgreSQL Migration', 8, '2026-10-09');
    `, [emp1Id]);

    // 12. Support Ticket
    await client.query(`
      INSERT INTO support_tickets (ticket_id, subject, category, priority, description, status, employee_id, assigned_to_id)
      VALUES ('TCK-2026-001', 'VPN Connectivity Sync', 'IT Support', 'High', 'Intermittent VPN disconnects on home setup', 'In Progress', $1, $2);
    `, [emp1Id, adminUserId]);

    // 13. Document
    await client.query(`
      INSERT INTO documents (title, document_type, uploaded_by_id, file_url, is_public)
      VALUES ('CodeThrive Engineering & Database Guidelines 2026', 'Policy', $1, 'https://codethrive.com/docs/guidelines.pdf', true);
    `, [adminUserId]);

    // 14. Notification
    await client.query(`
      INSERT INTO notifications (recipient_id, title, description, notification_type, priority)
      VALUES ($1, 'Neon PostgreSQL Live Connection', 'Database successfully migrated to Neon PostgreSQL cloud database.', 'System', 'High');
    `, [emp1UserId]);

    // 15. Task Activity
    await client.query(`
      INSERT INTO task_activities (task_id, user_id, action, previous_value, new_value, comment)
      VALUES ($1, $2, 'Status Changed', 'Assigned', 'In Progress', 'Database migration started');
    `, [task1Id, adminUserId]);

    console.log('✅ All 15 relational tables created & seeded successfully on Neon PostgreSQL!');

    console.log('\n--- VERIFYING TABLE LIST FROM NEON POSTGRESQL ---');
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Total Tables Found:', tableRes.rows.length);
    tableRes.rows.forEach(r => console.log('  • ' + r.table_name));

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Error during Neon setup:', err);
    process.exit(1);
  }
}

setupNeonPostgres();
