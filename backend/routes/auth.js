const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

// USER REGISTRATION
router.post("/register", async (req, res) => {
  try {
    const { full_name, email, mobile, password, role } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters",
      });
    }

    // Users cannot create admin accounts themselves.
    const accountRole = role === "provider" ? "provider" : "user";

    const hashedPassword = await bcrypt.hash(password, 12);

    const sql = `
      INSERT INTO users
      (full_name, email, mobile, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [full_name.trim(), email.trim().toLowerCase(), mobile || null, hashedPassword, accountRole],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
              message: "Email or mobile number already registered",
            });
          }

          console.error("Registration error:", err);
          return res.status(500).json({
            message: "Registration failed",
          });
        }

        res.status(201).json({
          message: "Account created successfully",
          userId: result.insertId,
          role: accountRole,
        });
      }
    );
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// USER LOGIN
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  const sql = `
    SELECT user_id, full_name, email, password_hash, role
    FROM users
    WHERE email = ?
  `;

  db.query(sql, [email.trim().toLowerCase()], async (err, results) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = results[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user.user_id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  });
});

module.exports = router;