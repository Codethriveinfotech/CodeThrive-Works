const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in the environment variables');
    }
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 2000 // fail fast if not running
    });
    console.log(`Database Connected Successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`Primary MongoDB Connection Failed: ${error.message}`);
    console.log('Initializing Local Persistent Database Fallback...');
    
    try {
      const dbPath = path.join(__dirname, '..', 'local-db');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      const mongod = await MongoMemoryServer.create({
        instance: {
          dbPath,
          storageEngine: 'wiredTiger' // persistent storage
        }
      });
      
      const uri = mongod.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`Database Connected Successfully (Local Persistent Fallback)`);
      return conn;
    } catch (fallbackError) {
      console.error(`CRITICAL: Backend server cannot start without a valid database connection.`);
      console.error(`Fallback Database Error: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
