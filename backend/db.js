const mysql = require("mysql2");

// Reuse a small connection pool across warm Netlify Function invocations.
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 4000,
  ssl: process.env.DB_SSL === "true" ? { minVersion: "TLSv1.2" } : undefined,
  waitForConnections: true,
  connectionLimit: 3,
  queueLimit: 0,
  enableKeepAlive: true,
});

module.exports = db;
