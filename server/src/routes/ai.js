// src/routes/ai.js
//
// Routes for AI resume scoring.
// Protected by verifyToken (user must be logged in) and validated by Zod scoreSchema.

const express = require("express");
const verifyToken = require("../middleware/verifyToken.js");
const { validate, scoreSchema } = require("../middleware/validate.js");
const { scoreResume } = require("../controllers/ai.controller.js");

const router = express.Router();


// STEP 4: Define POST /score/:id
// Middleware chain: verifyToken, validate(scoreSchema), then scoreResume
// Why "/score/:id"? When mounted at "/api/ai" in index.js, this becomes POST /api/ai/score/:id!
router.post("/score/:id", verifyToken, validate(scoreSchema), scoreResume);

module.exports = router;
