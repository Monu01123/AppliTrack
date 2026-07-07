// src/routes/applications.js
//
// All routes here are PROTECTED — every request must have a valid JWT.
// verifyToken runs first, attaches req.userId, then the controller runs.

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken.js");
const { getApplications, createApplication, getApplication, updateApplication, deleteApplication } = require("../controllers/applications.controller.js");
const { validate, applicationSchema, updateApplicationSchema } = require("../middleware/validate.js");

// ── ROUTES ────────────────────────────────────────────────────────────────────
// Pattern: router.METHOD("path", verifyToken, optionalValidation, controller)
//
// 🎯 Why do we use "/" and "/:id" instead of "/applications"?
// Because in index.js, we mount this entire file at "/api/applications".
// So router.get("/") automatically becomes GET /api/applications!

// STEP 4: GET /  → list all applications (with filter/sort/pagination)
// No body validation needed for GET requests!
router.get("/", verifyToken, getApplications);

// STEP 5: POST /  → create a new application
// Order matters: verifyToken FIRST (must be logged in), then validate body, then controller
router.post("/", verifyToken, validate(applicationSchema), createApplication);

// STEP 6: GET /:id  → get one application by id
router.get("/:id", verifyToken, getApplication);

// STEP 7: PATCH /:id  → update an application
// Use PATCH method (for partial updates), validate new body data with updateApplicationSchema (.partial())
router.patch("/:id", verifyToken, validate(updateApplicationSchema), updateApplication);

// STEP 8: DELETE /:id  → soft delete an application
// Use DELETE method! No body validation needed.
router.delete("/:id", verifyToken, deleteApplication);

module.exports = router;
