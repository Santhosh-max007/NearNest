const express = require("express");
const cors = require("cors");
const db = require("./db");

// Routes
const serviceRoutes = require("./routes/services");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = 5000;

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ==========================================
// API ROUTES
// ==========================================

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/admin", adminRoutes);

// ==========================================
// WELCOME ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.send("Welcome to NearNest API!");
});

// ==========================================
// DATABASE HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  db.query("SELECT 1", (err) => {
    if (err) {
      console.error("Database connection error:", err);

      return res.status(500).json({
        status: "Database connection failed",
        error: err.message,
      });
    }

    res.json({
      status: "Server and database connected successfully!",
    });
  });
});

// ==========================================
// GET APPROVED SERVICES
// WITH COMPLETE ORGANISATION DETAILS
// ==========================================

app.get("/api/services", (req, res) => {
  const sql = `
    SELECT
      s.service_id,
      s.service_name,
      s.description,
      s.address,
      s.city,
      s.phone,
      s.opening_hours,
      s.service_days,
      s.last_updated,
      s.verification_status,
      s.assistance_instructions,
      s.required_documents,
      s.approval_status,
      s.image_url,
      s.category_id,

      c.category_name

    FROM services s

    LEFT JOIN categories c
      ON s.category_id = c.category_id

    WHERE s.approval_status = 'approved'

    ORDER BY s.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Homepage services error:", err);

      return res.status(500).json({
        message: "Unable to fetch services",
        error: err.message,
      });
    }

    res.status(200).json(results);
  });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(
    `NearNest backend running at http://localhost:${PORT}`
  );
});