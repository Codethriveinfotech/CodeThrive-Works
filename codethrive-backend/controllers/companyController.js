const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const BACKUP_FILE = path.join(__dirname, '..', 'data', 'company_profile.json');

const defaultCompanyData = {
  companyName: 'CodeThrive Infotech',
  tagline: 'Enterprise Digital Transformation & Custom Software Solutions',
  registrationNumber: 'UDYAM-TN-2024-0012345',
  gstin: '33AABCC1234D1Z5',
  panNumber: 'AABCC1234D',
  foundedYear: '2024',
  employeeCount: '25+ Active Tech Specialists',
  officialEmail: 'contactcti@gmail.com',
  supportEmail: 'supportcti@gmail.com',
  officialPhone: '+91 78128 64905',
  headquarters: 'CodeThrive Works Tower, Level 4, Tech Park, Coimbatore, TN, India - 641035',
  website: 'https://codethrive.com',
  bankName: 'Canara Bank',
  accountNumber: '50200088991122',
  ifscCode: 'CNRB0001234',
  branchName: 'Tech Park Branch, Coimbatore',
  coreServicesDomain: 'Enterprise IT & Software',
  headquartersHub: 'Coimbatore Tech Park HQ',
  headquartersRegion: 'Tamil Nadu, India',
  leadershipMembers: [
    { id: 1, name: 'Mahadhevan', title: 'Chief Executive Officer (CEO)', email: 'mahadhevancti@gmail.com', phone: '+91 97878 57769', role: 'CodeThrive Infotech' },
    { id: 2, name: 'Kirubakaran', title: 'Managing Director (MD)', email: 'kirubakarancti@gmail.com', phone: '+91 78128 64905', role: 'CodeThrive Infotech' },
    { id: 3, name: 'Priyavadhana', title: 'HR Operations Manager', email: 'priyavadhanacti@gmail.com', phone: '+91 94895 10499', role: 'HR Lead' },
    { id: 4, name: 'Priyanga Josephin', title: 'IT Team Lead', email: 'priyangacti@gmail.com', phone: '+91 99432 23938', role: 'Tech Lead' },
    { id: 5, name: 'Jidendran', title: 'IT Team Lead', email: 'jidendrancti@gmail.com', phone: '+91 87547 20031', role: 'Tech Lead' },
    { id: 6, name: 'Soundharya', title: 'Operations Lead (Non-IT)', email: 'soundharyacti@gmail.com', phone: '+91 70927 29025', role: 'Ops Lead' }
  ]
};

// Ensure system_settings table exists
const ensureTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.warn('system_settings table check warning:', err.message);
  }
};

// @desc    Get company profile
// @route   GET /api/v1/company
// @access  Public / Authenticated
exports.getCompanyProfile = async (req, res) => {
  try {
    await ensureTable();
    const result = await pool.query("SELECT value FROM system_settings WHERE key = 'company_profile' LIMIT 1");
    if (result.rows.length > 0 && result.rows[0].value) {
      return res.status(200).json({ success: true, data: result.rows[0].value });
    }

    // Fallback to local file backup
    if (fs.existsSync(BACKUP_FILE)) {
      try {
        const fileData = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
        if (fileData) return res.status(200).json({ success: true, data: fileData });
      } catch {}
    }

    // Default fallback
    res.status(200).json({ success: true, data: defaultCompanyData });
  } catch (err) {
    console.error('getCompanyProfile error:', err);
    // Return default on error so UI never breaks
    res.status(200).json({ success: true, data: defaultCompanyData });
  }
};

// @desc    Update company profile
// @route   PUT /api/v1/company
// @access  Private (Admin / Authorized)
exports.updateCompanyProfile = async (req, res) => {
  try {
    await ensureTable();
    const updatedData = { ...defaultCompanyData, ...req.body };

    await pool.query(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ('company_profile', $1, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = $1, updated_at = NOW()
    `, [JSON.stringify(updatedData)]);

    // Also persist to disk as backup
    try {
      const dataDir = path.dirname(BACKUP_FILE);
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(BACKUP_FILE, JSON.stringify(updatedData, null, 2), 'utf8');
    } catch {}

    res.status(200).json({
      success: true,
      message: 'Company profile successfully saved to permanent storage',
      data: updatedData
    });
  } catch (err) {
    console.error('updateCompanyProfile error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
