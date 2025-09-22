const mysql = require('mysql2');

const pool = mysql.createPool({
  host: "3.111.53.73",
  port: 3306,        
  user: "nodeapi",
  password: "Root@123$",
  database: "node_api",
});

// mysql -u root -pRoot@123$ -h 3.110.207.203 -P 3306

// GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'Root@123$';
// FLUSH PRIVILEGES;

// const pool = mysql.createPool({
//   host: '3.110.207.203',
//   user: 'nodeapi',
//   password: 'Root@123$',
//   database: 'node_api',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   connectTimeout: 10000  // 10 seconds timeout
// });

const db = pool.promise();
module.exports = db;
