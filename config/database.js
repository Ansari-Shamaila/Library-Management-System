// This file handles the connection to MySQL database
// It's like a bridge between our app and the database
const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();
// Creating a connection pool (better than single connection)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convert pool to use promises (so we can use async/await)
const promisePool = pool.promise();
// Test the connection
(async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    }
})();
module.exports = promisePool;