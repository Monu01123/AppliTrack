// src/routes/auth.js
//
// Routes are just the "wiring" — they map URLs to controller functions.
// Notice how clean this file is — no business logic here, just routing.
//
// Middleware order matters: validate(schema) runs BEFORE the controller.
// If validation fails, the controller never runs.

const express = require("express");
const router = express.Router();

const { register, login, refresh, logout } = require("../controllers/auth.controller");
const { validate, registerSchema, loginSchema } = require("../middleware/validate");

// POST /api/auth/register
// Flow: validate req.body → register controller
router.post("/register", validate(registerSchema), register);

// POST /api/auth/login
// Flow: validate req.body → login controller
router.post("/login", validate(loginSchema), login);

// POST /api/auth/refresh
// No body validation needed — it reads from the cookie
router.post("/refresh", refresh);

// POST /api/auth/logout
router.post("/logout", logout);

module.exports = router;
