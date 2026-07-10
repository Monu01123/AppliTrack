// src/routes/public.js
//
// Unauthenticated public route for shareable candidate showcase profiles.

const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { getPublicProfile } = require("../controllers/public.controller");

const publicProfileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,                  // Max 30 profile views per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many profile views from this IP. Please try again later." },
});

router.get("/profile/:slugOrId", publicProfileLimiter, getPublicProfile);

module.exports = router;
