const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config(); // populate environment variables
const isProd = (process.env.NODE_ENV === 'production');


/**
 * Create a Postgres connection pool.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProd ? { rejectUnauthorized: false } : false, // require SSL db connection in prod but not dev
});

module.exports = pool;
