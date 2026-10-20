require('dotenv').config();
const { Pool } = require('pg');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');

let mongodInstance = null;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const connectDB = async () => {
  // 1. Connect Neon PostgreSQL
  try {
    if (process.env.DATABASE_URL) {
      const client = await pool.connect();
      console.log('⚡ Neon PostgreSQL Cloud Database Connected Successfully!');
      client.release();
    }
  } catch (error) {
    console.warn(`⚠️ Neon PostgreSQL Connection Warning: ${error.message}`);
  }

  // 2. Connect Mongoose (for Employee, DailyReport, User, etc. models)
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 3000
      });
      console.log('⚡ MongoDB / Mongoose Connected Successfully via MONGO_URI');
    } else {
      throw new Error('No MONGO_URI, using local persistent fallback');
    }
  } catch (mongoErr) {
    try {
      const dbPath = path.join(__dirname, '..', 'local-db');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbPath
        }
      });
      const uri = mongodInstance.getUri();
      await mongoose.connect(uri);
      console.log('⚡ Mongoose Database Connected Successfully (Local Persistent DB)');
    } catch (fallbackErr) {
      console.error(`❌ Mongoose Connection Error: ${fallbackErr.message}`);
    }
  }

  return pool;
};

module.exports = {
  connectDB,
  pool,
  query: (text, params) => pool.query(text, params)
};

