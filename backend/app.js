const express = require("express");
const cors = require("cors");
const db = require("./db");

const serviceRoutes = require("./routes/services");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => res.send("Welcome to NearNest API!"));

app.get("/api/health", (req, res) => {
  db.query("SELECT 1", (err) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ status: "Database connection failed" });
    }
    res.json({ status: "Server and database connected successfully!" });
  });
});

// Public homepage service listing.
app.get("/api/services", (req, res) => {
  const sql = `
    SELECT s.service_id, s.service_name, s.description, s.address, s.city,
      s.phone, s.opening_hours, s.service_days, s.last_updated,
      s.verification_status, s.assistance_instructions, s.required_documents,
      s.approval_status, s.image_url, s.category_id, c.category_name
    FROM services s
    LEFT JOIN categories c ON s.category_id = c.category_id
    WHERE s.approval_status = 'approved'
    ORDER BY s.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Homepage services error:", err);
      return res.status(500).json({ message: "Unable to fetch services" });
    }
    res.status(200).json(results);
  });
});

module.exports = app;
