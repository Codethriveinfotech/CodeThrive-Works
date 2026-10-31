require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function resetDatabaseFreshLive() {
  console.log('--- STARTING LIVE PRODUCTION DATABASE PURGE & FRESH RESET ---');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Clear child and operational tables
    console.log('1. Clearing activity logs, tasks, sessions, attendances...');
    await client.query('DELETE FROM task_activities');
    await client.query('DELETE FROM tasks');
    await client.query('DELETE FROM attendance_sessions');
    await client.query('DELETE FROM attendance_corrections');
    await client.query('DELETE FROM attendances');
    await client.query('DELETE FROM documents');
    await client.query('DELETE FROM daily_reports');
    await client.query('DELETE FROM timesheets');
    await client.query('DELETE FROM leave_requests');
    await client.query('DELETE FROM payrolls');
    await client.query('DELETE FROM support_tickets');
    await client.query('DELETE FROM meetings');
    await client.query('DELETE FROM notifications');

    // 2. Prepare Superadmin credentials
    const adminEmail = 'admin@codethrive.com';
    const adminPasswordPlain = 'Code@2026';
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash(adminPasswordPlain, salt);

    // Ensure superadmin exists in users
    let userRes = await client.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
      [adminEmail]
    );

    let adminUserId;
    if (userRes.rows.length > 0) {
      adminUserId = userRes.rows[0].id;
      await client.query(
        "UPDATE users SET password = $1, role = 'superadmin', status = 'active' WHERE id = $2",
        [adminPasswordHash, adminUserId]
      );
      console.log(`2. Updated existing Superadmin user (${adminEmail}) password to Code@2026.`);
    } else {
      const newUser = await client.query(
        "INSERT INTO users (email, password, role, status) VALUES ($1, $2, 'superadmin', 'active') RETURNING id",
        [adminEmail, adminPasswordHash]
      );
      adminUserId = newUser.rows[0].id;
      console.log(`2. Inserted fresh Superadmin user (${adminEmail}).`);
    }

    // 3. Delete all other users
    const delUsers = await client.query(
      "DELETE FROM users WHERE LOWER(email) != LOWER($1)",
      [adminEmail]
    );
    console.log(`3. Deleted ${delUsers.rowCount} test user accounts.`);

    // 4. Handle employees table: keep only admin profile
    const delEmps = await client.query(
      "DELETE FROM employees WHERE LOWER(personal_email_address) != LOWER($1) AND id NOT IN (SELECT id FROM employees WHERE user_id = $2)",
      [adminEmail, adminUserId]
    );
    console.log(`4. Deleted ${delEmps.rowCount} test employee records.`);

    // Check admin employee profile
    const empCheck = await client.query(
      "SELECT id FROM employees WHERE user_id = $1 OR LOWER(personal_email_address) = LOWER($2)",
      [adminUserId, adminEmail]
    );

    if (empCheck.rows.length > 0) {
      await client.query(
        `UPDATE employees SET 
          user_id = $1,
          employee_id = 'CTI-ADM-001',
          full_name = 'CodeThrive Admin',
          personal_email_address = $2,
          personal_phone_number = '+91 78128 64905',
          designation = 'Super Administrator',
          department = 'Management',
          status = 'Active'
         WHERE id = $3`,
        [adminUserId, adminEmail, empCheck.rows[0].id]
      );
      console.log('5. Updated Superadmin profile record (CTI-ADM-001).');
    } else {
      await client.query(
        `INSERT INTO employees (
          user_id, employee_id, full_name, personal_email_address, personal_phone_number, designation, department, status
        ) VALUES ($1, 'CTI-ADM-001', 'CodeThrive Admin', $2, '+91 78128 64905', 'Super Administrator', 'Management', 'Active')`,
        [adminUserId, adminEmail]
      );
      console.log('5. Created Superadmin profile record (CTI-ADM-001).');
    }

    await client.query('COMMIT');
    console.log('--- ALL TRANSACTIONS COMMITTED SUCCESSFULLY ---');

    // Print table verification
    console.log('\n--- VERIFICATION OF DATABASE TABLES ---');
    const tables = [
      'users',
      'employees',
      'attendances',
      'attendance_sessions',
      'attendance_corrections',
      'tasks',
      'task_activities',
      'documents',
      'daily_reports',
      'timesheets',
      'leave_requests',
      'payrolls',
      'support_tickets',
      'meetings',
      'notifications'
    ];

    for (const t of tables) {
      const c = await client.query(`SELECT count(*) FROM "${t}"`);
      console.log(`  Table [${t}]: ${c.rows[0].count} rows`);
    }

    const verifiedUser = await client.query("SELECT id, email, role, status FROM users");
    console.log('\nUsers in DB:', verifiedUser.rows);

    const verifiedEmp = await client.query("SELECT id, employee_id, full_name, personal_email_address, designation FROM employees");
    console.log('Employees in DB:', verifiedEmp.rows);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error during purge, transaction rolled back:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabaseFreshLive();
