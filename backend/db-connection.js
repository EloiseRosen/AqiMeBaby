const dotenv = require('dotenv');
const { Pool } = require("pg");


dotenv.config();
const isProd = (process.env.NODE_ENV === 'production');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProd ? { rejectUnauthorized: false } : false, // require SSL db connection in prod but not dev
});

module.exports = pool;
