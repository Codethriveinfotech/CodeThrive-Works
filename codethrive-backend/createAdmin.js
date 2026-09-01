const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const connectDB = require('./config/db');

const createAdmin = async () => {
  try {
    await connectDB();

    let admin = await User.findOne({ email: 'admin@codethrive.com' });
    if (!admin) {
      admin = await User.create({
        email: 'admin@codethrive.com',
        password: 'Password@123',
        role: 'superadmin',
        status: 'active'
      });
      console.log('Admin user created successfully.');
    } else {
      admin.password = 'Password@123';
      admin.role = 'superadmin';
      admin.status = 'active';
      await admin.save();
      console.log('Admin user updated successfully.');
    }
    
    console.log('Admin Login - Email: admin@codethrive.com, Password: Password@123');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();
