// src/routes/applications.js
//
// All routes here are PROTECTED — every request must have a valid JWT.
// verifyToken runs first, attaches req.userId, then the controller runs.

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken.js");
const { getApplications, createApplication, getApplication, updateApplication, deleteApplication } = require("../controllers/applications.controller.js");
const { validate, applicationSchema } = require("../middleware/validate.js");


// ── ROUTES ────────────────────────────────────────────────────────────────────
// Pattern: router.METHOD("path", verifyToken, optionalValidation, controller)

// STEP 4: GET /  → list all applications (with filter/sort/pagination)
// Middleware chain: verifyToken, then getApplications
route.get("/applications", validate(applicationSchema), getApplications);

// STEP 5: POST /  → create a new application
// Middleware chain: verifyToken, validate(applicationSchema), then createApplication
route.post("/Create-application", validate(applicationSchema), verifyToken, createApplication);

// STEP 6: GET /:id  → get one application by id
route.get("/get-application/:id", validate(applicationSchema), getApplication);

// STEP 7: PATCH /:id  → update an application
route.get("/upd-application/:id", validate(applicationSchema), updateApplication);

// STEP 8: DELETE /:id  → soft delete an application
route.get("/del-application/:id", validate(applicationSchema), deleteApplication);

module.exports = router;
