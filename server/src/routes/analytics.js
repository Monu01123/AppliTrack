// src/routes/analytics.js
//
// Routes for job search analytics and funnel summary.
// Protected by verifyToken so users only see stats for their own applications.

const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken.js");

const { getAnalyticsSummary } = require("../controllers/analytics.controller.js");

router.get("/summary", verifyToken, getAnalyticsSummary);

module.exports = router;
