const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function migrateNeonColumns() {
  try {
    await client.connect();
    console.log('Connected to Neon PostgreSQL for column sync...');

    const queries = [
      // employees columns
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS gender VARCHAR(50);`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS date_of_birth TIMESTAMP WITH TIME ZONE;`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS blood_group VARCHAR(20);`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50);`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS nationality VARCHAR(100) DEFAULT 'Indian';`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS current_address TEXT;`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS permanent_address TEXT;`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_details JSONB;`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS qualification VARCHAR(255);`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS college_name VARCHAR(255);`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS graduation_year VARCHAR(50);`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS previous_company VARCHAR(255);`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS total_experience VARCHAR(50);`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]';`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS technology_knowledge JSONB DEFAULT '[]';`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS resume_upload TEXT;`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS aadhaar_or_identity_proof_number VARCHAR(100);`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS identity_proof_upload TEXT;`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS address_proof_upload TEXT;`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS educational_certificate_upload TEXT;`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS experience_certificate_upload TEXT;`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS offer_letter_upload TEXT;`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS passport_size_photo_upload TEXT;`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_account_holder_name VARCHAR(255);`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS account_number VARCHAR(100);`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(50);`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS branch_name VARCHAR(255);`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS pan_number VARCHAR(50);`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100);`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS reporting_manager_id UUID REFERENCES employees(id);`,

      // attendances columns
      `ALTER TABLE attendances ADD COLUMN IF NOT EXISTS total_break_duration_in_seconds INT DEFAULT 0;`,
      `ALTER TABLE attendances ADD COLUMN IF NOT EXISTS total_lunch_duration_in_seconds INT DEFAULT 0;`,
      `ALTER TABLE attendances ADD COLUMN IF NOT EXISTS is_manual_correction BOOLEAN DEFAULT FALSE;`,
      `ALTER TABLE attendances ADD COLUMN IF NOT EXISTS correction_reason TEXT;`,

      // daily_reports columns
      `ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS project_title VARCHAR(255) DEFAULT 'General Project';`,
      `ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS progress_status VARCHAR(100) DEFAULT 'Completed';`,
      `ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS productivity_rating INT DEFAULT 5;`,
      `ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';`,
      `ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS src_file_url TEXT;`,
      `ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS src_file_name VARCHAR(255);`,
      `ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS src_file_size VARCHAR(50);`,

      // meetings columns
      `ALTER TABLE meetings ADD COLUMN IF NOT EXISTS participants JSONB DEFAULT '[]';`,

      // support_tickets columns
      `ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';`,

      // users columns
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expire TIMESTAMP WITH TIME ZONE;`
    ];

    for (const q of queries) {
      await client.query(q);
    }

    console.log('✅ All Neon PostgreSQL table columns synced successfully!');
    await client.end();
  } catch (err) {
    console.error('Column sync error:', err.message);
    process.exit(1);
  }
}

migrateNeonColumns();
