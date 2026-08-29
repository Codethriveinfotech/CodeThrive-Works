const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/codethrive_db');

    console.log('MongoDB connected...');

    // Clear existing users
    await User.deleteMany();

    // Create Admin User
    const adminUser = await User.create({
      email: 'admin@codethrive.com',
      password: 'Password@123',
      role: 'superadmin',
      status: 'active'
    });

    // Create Employee User
    const employeeUser = await User.create({
      email: 'employee@codethrive.com',
      password: 'Password@123',
      role: 'employee',
      status: 'active'
    });

    console.log('Database seeded successfully!');
    console.log('Admin Login - Email: admin@codethrive.com, Password: Password@123');
    console.log('Employee Login - Email: employee@codethrive.com, Password: Password@123');
    
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDatabase();
