// src/routes/analytics.js
//
// Routes for job search analytics and funnel summary.
// Protected by verifyToken so users only see stats for their own applications.

const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken.js");

const {
  getAnalyticsSummary,
  sendWeeklyDigest,
  getGoalStats,
  updateDailyTarget,
} = require("../controllers/analytics.controller.js");

router.get("/summary", verifyToken, getAnalyticsSummary);
router.post("/digest", verifyToken, sendWeeklyDigest);
router.get("/goals", verifyToken, getGoalStats);
router.patch("/goals", verifyToken, updateDailyTarget);

module.exports = router;
