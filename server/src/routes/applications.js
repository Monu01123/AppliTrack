// src/routes/applications.js
//
// All routes here are PROTECTED — every request must have a valid JWT.
// verifyToken runs first, attaches req.userId, then the controller runs.

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken.js");
const { getApplications, createApplication, getApplication, updateApplication, deleteApplication, exportApplications } = require("../controllers/applications.controller.js");
const { scoreResume } = require("../controllers/ai.controller.js");
const { validate, applicationSchema, updateApplicationSchema, scoreSchema } = require("../middleware/validate.js");

router.get("/", verifyToken, getApplications);
router.get("/export", verifyToken, exportApplications);
router.post("/", verifyToken, validate(applicationSchema), createApplication);

router.get("/:id", verifyToken, getApplication);
router.post("/:id/score", verifyToken, validate(scoreSchema), scoreResume);
router.patch("/:id", verifyToken, validate(updateApplicationSchema), updateApplication);
router.put("/:id", verifyToken, validate(updateApplicationSchema), updateApplication);
router.delete("/:id", verifyToken, deleteApplication);

module.exports = router;
