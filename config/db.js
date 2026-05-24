const mysql = require('mysql2');
require('dotenv').config();

const rawPool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ✅ Test connection (callback is fine here)
rawPool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ DB CONNECTION FAILED:', err.message);
  } else {
    console.log('✅ DB CONNECTED SUCCESSFULLY');
    connection.release();
  }
});

// ✅ Promise pool
const promisePool = rawPool.promise();

module.exports = {
  query: promisePool.query.bind(promisePool),

  executeQuery: async (query, params = []) => {
    try {
      const [rows] = await promisePool.query(query, params);
      return rows;
    } catch (err) {
      console.error('❌ SQL ERROR:', err.message);
      throw err;
    }
  },

  // 🔥 FIXED
  getConnection: promisePool.getConnection.bind(promisePool),
};