// const { Pool } = require('pg');
// require('dotenv').config();
//
//
// const pool = new Pool({
//     connectionString: process.env.DATABASE_URL,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     database: process.env.DB_NAME,
//     ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
// });
//
// const connectDB = async () => {
//     try {
//         await pool.query('SELECT NOW()');
//         console.log('✅ PostgreSQL Database Connected Successfully');
//     } catch (error) {
//         console.error(`❌ Database Connection Error: ${error.message}`);
//         process.exit(1);
//     }
// };
//
//
// module.exports = {
//     query: (text, params) => pool.query(text, params),
//     connectDB,
// };


const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const connectDB = async () => {
    try {
        await pool.query('SELECT NOW()');
        console.log('✅ PostgreSQL Database Connected Successfully');
    } catch (error) {
        console.error(`❌ Database Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = {
    query: (text, params) => pool.query(text, params),
    connectDB,
    pool, // 🟢 ADD THIS LINE: Exports the pool instance
};