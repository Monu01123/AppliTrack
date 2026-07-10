// src/routes/auth.js
//
// Routes are just the "wiring" — they map URLs to controller functions.
// Notice how clean this file is — no business logic here, just routing.
//
// Middleware order matters: validate(schema) runs BEFORE the controller.
// If validation fails, the controller never runs.

const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                  // Limit each IP to 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Please try again in 15 minutes." },
});

const { register, login, refresh, logout } = require("../controllers/auth.controller");
const { validate, registerSchema, loginSchema } = require("../middleware/validate");

// POST /api/auth/register
// Flow: validate req.body → register controller
router.post("/register", authLimiter, validate(registerSchema), register);

// POST /api/auth/login
// Flow: validate req.body → login controller
router.post("/login", authLimiter, validate(loginSchema), login);

// POST /api/auth/refresh
// No body validation needed — it reads from the cookie
router.post("/refresh", refresh);

// POST /api/auth/logout
router.post("/logout", logout);

const verifyToken = require("../middleware/verifyToken");
const {
  updatePublicProfileSettings,
  getPublicProfileSettings,
} = require("../controllers/public.controller");

router.get("/profile/public", verifyToken, getPublicProfileSettings);
router.patch("/profile/public", verifyToken, updatePublicProfileSettings);

module.exports = router;
