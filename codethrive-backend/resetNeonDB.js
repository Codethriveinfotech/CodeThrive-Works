const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function resetDB() {
  try {
    await client.connect();
    console.log('Connected to Neon PostgreSQL...');

    // Drop all tables and recreate fresh (clean slate)
    console.log('\nDropping all existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS 
        notifications, documents, support_tickets, timesheets, task_activities, tasks,
        payrolls, meetings, daily_reports, leave_requests, attendance_corrections,
        attendance_sessions, attendances, employees, users
      CASCADE;
    `);
    console.log('All tables dropped!');

    // Recreate all 15 tables fresh
    console.log('\nRecreating all 15 tables fresh...');
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
        profile_photo TEXT,
        address TEXT,
        emergency_contact VARCHAR(255),
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
        total_work_duration_in_seconds INT DEFAULT 0,
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
        allowance_details JSONB DEFAULT '{}',
        deduction_details JSONB DEFAULT '{}',
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
        status VARCHAR(100) DEFAULT 'Assigned',
        progress_percentage INT DEFAULT 0,
        start_date TIMESTAMP WITH TIME ZONE,
        due_date TIMESTAMP WITH TIME ZONE,
        due_time VARCHAR(20),
        estimated_hours NUMERIC(6,2),
        actual_hours NUMERIC(6,2) DEFAULT 0,
        attachments JSONB DEFAULT '[]',
        links JSONB DEFAULT '{}',
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

    console.log('All 15 tables recreated successfully!');

    // Verify
    const check = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name;
    `);
    
    console.log('\n--- CLEAN DATABASE TABLES (0 rows each) ---');
    for (let row of check.rows) {
      const cnt = await client.query('SELECT count(*) FROM ' + row.table_name);
      console.log('  • ' + row.table_name + ': ' + cnt.rows[0].count + ' rows');
    }

    console.log('\n✅ Neon PostgreSQL database is now CLEAN & FRESH!');
    console.log('   All 15 tables are empty and ready for real usage.');
    
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Reset Error:', err.message);
    await client.end();
    process.exit(1);
  }
}

resetDB();
