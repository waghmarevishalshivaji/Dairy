const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: "node_user",
  password: "Dairy@123$",
  database: "node_api",
});

const db = pool.promise();
module.exports = db;
