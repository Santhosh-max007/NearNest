const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

// VERIFY PROVIDER LOGIN
const verifyProvider = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Please log in first",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "provider") {
      return res.status(403).json({
        message: "Only service providers can access this feature",
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired login session",
    });
  }
};


// GET PROVIDER'S OWN BUSINESSES
router.get("/my", verifyProvider, (req, res) => {
  const sql = `
    SELECT
      service_id,
      service_name,
      description,
      address,
      city,
      phone,
      opening_hours,
      service_days,
      last_updated,
      verification_status,
      assistance_instructions,
      required_documents,
      approval_status,
      created_at,
      category_id
    FROM services
    WHERE provider_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [req.user.userId], (err, results) => {
    if (err) {
      console.error("Provider businesses error:", err);

      return res.status(500).json({
        message: "Unable to fetch your businesses",
      });
    }

    res.json(results);
  });
});


// ADD A NEW BUSINESS
router.post("/", verifyProvider, (req, res) => {
  const {
    service_name,
    category_id,
    description,
    address,
    city,
    phone,
    opening_hours,
    service_days,
    assistance_instructions,
    required_documents,
  } = req.body;

  if (!service_name || !category_id || !address) {
    return res.status(400).json({
      message: "Business name, category and address are required",
    });
  }

  const sql = `
    INSERT INTO services
    (
      provider_id,
      category_id,
      service_name,
      description,
      address,
      city,
      phone,
      opening_hours,
      service_days,
      last_updated,
      verification_status,
      assistance_instructions,
      required_documents,
      approval_status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE, 'pending', ?, ?, 'pending')
  `;

  db.query(
    sql,
    [
      req.user.userId,
      category_id,
      service_name.trim(),
      description || null,
      address.trim(),
      city || null,
      phone || null,
      opening_hours || null,
      service_days || null,
      assistance_instructions || null,
      required_documents || null,
    ],
    (err, result) => {
      if (err) {
        console.error("Business registration error:", err);

        return res.status(500).json({
          message: "Unable to register business",
        });
      }

      res.status(201).json({
        message: "Business submitted successfully for admin approval!",
        serviceId: result.insertId,
        status: "pending",
      });
    }
  );
});


// UPDATE PROVIDER'S OWN BUSINESS
router.put("/:id", verifyProvider, (req, res) => {
  const serviceId = req.params.id;

  const {
    service_name,
    category_id,
    description,
    address,
    city,
    phone,
    opening_hours,
    service_days,
    assistance_instructions,
    required_documents,
  } = req.body;

  if (
    !service_name ||
    !category_id ||
    !address ||
    !Number.isInteger(Number(serviceId))
  ) {
    return res.status(400).json({
      message: "Valid business ID, name, category and address are required",
    });
  }

  const sql = `
    UPDATE services
    SET
      category_id = ?,
      service_name = ?,
      description = ?,
      address = ?,
      city = ?,
      phone = ?,
      opening_hours = ?,
      service_days = ?,
      last_updated = CURRENT_DATE,
      verification_status = 'pending',
      assistance_instructions = ?,
      required_documents = ?,
      approval_status = 'pending'
    WHERE service_id = ?
      AND provider_id = ?
  `;

  db.query(
    sql,
    [
      category_id,
      service_name.trim(),
      description || null,
      address.trim(),
      city || null,
      phone || null,
      opening_hours || null,
      service_days || null,
      assistance_instructions || null,
      required_documents || null,
      serviceId,
      req.user.userId,
    ],
    (err, result) => {
      if (err) {
        console.error("Business update error:", err);

        return res.status(500).json({
          message: "Unable to update business",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Business not found or you are not authorized",
        });
      }

      res.json({
        message: "Business updated successfully and sent for admin approval",
        serviceId,
        status: "pending",
      });
    }
  );
});

module.exports = router;