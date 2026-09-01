const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100 // 100 requests per windowMs
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

app.get('/', (req, res) => {
  res.send('CodeThrive API is running...');
});

const PORT = process.env.PORT || 5000;

const User = require('./models/User');

// Connect to database, then start the server
connectDB().then(async () => {
  // Auto-seed admin user if missing
  try {
    let admin = await User.findOne({ email: 'admin@codethrive.com' });
    if (!admin) {
      await User.create({
        email: 'admin@codethrive.com',
        password: 'Password@123',
        role: 'superadmin',
        status: 'active'
      });
      console.log('Admin user auto-seeded (admin@codethrive.com)');
    } else {
      admin.password = 'Password@123';
      admin.role = 'superadmin';
      admin.status = 'active';
      await admin.save();
      console.log('Admin user verified (admin@codethrive.com)');
    }
  } catch (err) {
    console.error('Failed to auto-seed admin:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});
