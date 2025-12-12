const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Check if the host implies a remote connection (not localhost)
// If you are using DigitalOcean's IP/Host, this will be true.
const isRemoteDB = process.env.DB_HOST &&
    process.env.DB_HOST !== 'localhost' &&
    process.env.DB_HOST !== '127.0.0.1';

// Determine SSL usage:
// 1. If we are in Production
// 2. OR if we are connecting to a Remote DB (DigitalOcean) from local
// 3. OR if a DATABASE_URL string is provided (usually implies cloud)
const useSSL = isProduction || isRemoteDB || process.env.DATABASE_URL;

const connectionConfig = {
    connectionString: process.env.DATABASE_URL ||
        `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,

    // DigitalOcean requires this SSL setting
    ssl: useSSL ? { rejectUnauthorized: false } : false
};

const pool = new Pool(connectionConfig);

const connectDB = async () => {
    try {
        await pool.query('SELECT NOW()');
        console.log(`✅ PostgreSQL Connected Successfully`);
        console.log(`   Host: ${process.env.DB_HOST || 'via Connection String'}`);
        console.log(`   SSL: ${useSSL ? 'Enabled (Required for DigitalOcean)' : 'Disabled'}`);
    } catch (error) {
        console.error(`❌ Database Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = {
    query: (text, params) => pool.query(text, params),
    connectDB,
    pool,
};