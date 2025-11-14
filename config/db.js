const { Pool } = require('pg');

const connectDB = async () => {
    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false // Required for some cloud hosts
        });

        await pool.query('SELECT NOW()');

        console.log('PostgreSQL Database Connected Successfully');
    } catch (error) {
        console.error(`Database Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;