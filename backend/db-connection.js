const dotenv = require('dotenv');
const path = require('path');
const Pool = require("pg").Pool;

// for connecting to local dev db, dotenv.config gets values from .env file
// and populates process.env.DB_USER etc.
// dotenv doesn't overwrite process.env. values that are already set, which 
// is why this is still fine in prod.
dotenv.config({path: path.resolve(__dirname, '../.env')});


const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT
});

module.exports = pool;
