require('dotenv').config();
const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'school_demo'
});

db.connect((error) => {
    if (error) {
        console.error('MySQL Connection Failed:', error);
        return;
    }
    console.log('Connected To MySQL.');
});

module.exports = db;