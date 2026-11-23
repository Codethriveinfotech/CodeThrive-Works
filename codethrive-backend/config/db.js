require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('⚡ Neon PostgreSQL Cloud Database Connected Successfully (Single Database Unified)');
    client.release();
  } catch (error) {
    console.error(`❌ Neon PostgreSQL Connection Error: ${error.message}`);
    throw error;
  }
  return pool;
};

module.exports = {
  connectDB,
  pool,
  query: (text, params) => pool.query(text, params)
};
