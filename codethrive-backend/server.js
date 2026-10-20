const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { connectDB, query } = require('./config/db');
const path = require('path');

// Load env vars
dotenv.config();


// Route files
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const reportRoutes = require('./routes/reportRoutes');
const timesheetRoutes = require('./routes/timesheetRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dailyReportRoutes = require('./routes/dailyReportRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const documentRoutes = require('./routes/documentRoutes');
const supportRoutes = require('./routes/supportRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const adminAttendanceRoutes = require('./routes/adminAttendanceRoutes');

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Security headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true
}));

// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting (set high limit for development & internal workspace portal)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100000 // 100,000 requests per windowMs (prevents false rate limiting during active sessions)
});
app.use(limiter);

// Mount routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/timesheet', timesheetRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/daily-reports', dailyReportRoutes);
app.use('/api/v1/meetings', meetingRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/admin/attendance', adminAttendanceRoutes);

app.get('/', (req, res) => {
  res.send('CodeThrive API is running...');
});

const PORT = process.env.PORT || 5000;

// Connect to Neon PostgreSQL database, then start express server
connectDB().then(async () => {
  try {
    const adminCheck = await query('SELECT * FROM users WHERE email = $1', ['admin@codethrive.com']);
    if (adminCheck.rows.length === 0) {
      console.log('Admin user missing in Neon PostgreSQL. Run node setupNeonPostgres.js to seed.');
    } else {
      console.log('⚡ Admin user verified on Neon PostgreSQL (admin@codethrive.com)');
    }
  } catch (err) {
    console.error('Failed to verify admin on Neon PostgreSQL:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});
