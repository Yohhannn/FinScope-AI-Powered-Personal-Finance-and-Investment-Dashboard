const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Configuration object
const connectionConfig = {
    // If DATABASE_URL is set (Production), use it. 
    // Otherwise, build the string from local .env parts
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    
    // SSL Configuration: Required for DigitalOcean
    ssl: isProduction ? { rejectUnauthorized: false } : false
};

const pool = new Pool(connectionConfig);

const connectDB = async () => {
    try {
        await pool.query('SELECT NOW()');
        console.log(`✅ PostgreSQL Connected Successfully in ${isProduction ? 'Production' : 'Development'} mode`);
    } catch (error) {
        console.error(`❌ Database Connection Error: ${error.message}`);
        // Do not exit process in production immediately; let it retry or fail gracefully usually
        // But for startup debugging, this is fine:
        process.exit(1); 
    }
};

module.exports = {
    query: (text, params) => pool.query(text, params),
    connectDB,
    pool,
};
