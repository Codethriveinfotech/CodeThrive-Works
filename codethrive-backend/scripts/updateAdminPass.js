require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function updatePassword() {
  try {
    const newPassword = 'Code@2026';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    const res = await pool.query(
      "UPDATE users SET password = $1 WHERE LOWER(email) = LOWER('admin@codethrive.com') RETURNING id, email, role",
      [hash]
    );

    console.log('Admin password update success:', res.rows);

    // Also check if any superadmin user exists with different email
    const allAdmins = await pool.query("SELECT id, email, role FROM users WHERE role IN ('admin', 'superadmin')");
    console.log('All admins in database:', allAdmins.rows);

    // If there are other admin emails, update them or report
    for (const admin of allAdmins.rows) {
      await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hash, admin.id]);
      console.log(`Updated password for admin user ${admin.email} (role: ${admin.role}) to Code@2026`);
    }

    await pool.end();
    console.log('Done.');
  } catch (err) {
    console.error('Error updating admin password:', err);
    process.exit(1);
  }
}

updatePassword();
