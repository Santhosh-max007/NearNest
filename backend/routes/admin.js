const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

// VERIFY ADMIN
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Please log in first",
    });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        message: "Admin access only",
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

// GET ALL BUSINESSES
router.get("/businesses", verifyAdmin, (req, res) => {
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
      s.created_at,
      c.category_name,
      u.full_name AS provider_name,
      u.email AS provider_email,
      u.mobile AS provider_mobile
    FROM services s
    LEFT JOIN categories c
      ON s.category_id = c.category_id
    LEFT JOIN users u
      ON s.provider_id = u.user_id
    ORDER BY s.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Admin fetch error:", err);

      return res.status(500).json({
        message: "Unable to fetch businesses",
      });
    }

    res.json(results);
  });
});

// APPROVE OR REJECT BUSINESS
router.patch("/businesses/:id/status", verifyAdmin, (req, res) => {
  const serviceId = Number(req.params.id);
  const { status } = req.body;

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return res.status(400).json({
      message: "Invalid business ID",
    });
  }

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({
      message: "Invalid approval status",
    });
  }

  const sql = `
    UPDATE services
    SET approval_status = ?
    WHERE service_id = ?
  `;

  db.query(sql, [status, serviceId], (err, result) => {
    if (err) {
      console.error("Approval update error:", err);

      return res.status(500).json({
        message: "Unable to update approval status",
      });
    }

    if (result.affectedRows === 0) {
      return db.query(
        "SELECT service_id FROM services WHERE service_id = ?",
        [serviceId],
        (selectError, rows) => {
          if (selectError) {
            return res.status(500).json({
              message: "Unable to verify business record",
            });
          }

          if (rows.length === 0) {
            return res.status(404).json({
              message: "Business not found",
            });
          }

          return res.json({
            message: `Business is already ${status}`,
            serviceId,
            status,
          });
        }
      );
    }

    res.json({
      message: `Business ${status} successfully`,
      serviceId,
      status,
    });
  });
});

// UPDATE ORGANISATION VERIFICATION
router.patch(
  "/businesses/:id/verification",
  verifyAdmin,
  (req, res) => {
    const serviceId = Number(req.params.id);
    const { verification_status } = req.body;

    const allowedStatuses = [
      "pending",
      "verified",
      "needs_updating",
    ];

    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      return res.status(400).json({
        message: "Invalid business ID",
      });
    }

    if (!allowedStatuses.includes(verification_status)) {
      return res.status(400).json({
        message: "Invalid verification status",
      });
    }

    const sql = `
      UPDATE services
      SET verification_status = ?
      WHERE service_id = ?
    `;

    db.query(sql, [verification_status, serviceId], (err, result) => {
      if (err) {
        console.error("Verification update error:", err);

        return res.status(500).json({
          message: "Unable to update verification status",
          error: err.message,
        });
      }

      // Check whether the business exists even if no rows changed.
      if (result.affectedRows === 0) {
        return db.query(
          "SELECT service_id FROM services WHERE service_id = ?",
          [serviceId],
          (selectError, rows) => {
            if (selectError) {
              return res.status(500).json({
                message: "Unable to verify business record",
              });
            }

            if (rows.length === 0) {
              return res.status(404).json({
                message: "Business not found",
              });
            }

            return res.json({
              message: `Organisation is already ${verification_status.replace(
                "_",
                " "
              )}`,
              serviceId,
              verification_status,
            });
          }
        );
      }

      console.log(
        `Business ${serviceId} verification updated to ${verification_status}`
      );

      res.json({
        message: "Organisation verification status updated successfully",
        serviceId,
        verification_status,
      });
    });
  }
);

module.exports = router;