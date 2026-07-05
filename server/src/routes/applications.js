// src/routes/applications.js
//
// All routes are protected — verifyToken runs first on every request
// 💡 Notice how clean this is: no logic here, just wiring

const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const { validate, applicationSchema } = require("../middleware/validate");
const {
  getApplications,
  createApplication,
  getApplication,
  updateApplication,
  deleteApplication,
} = require("../controllers/applications.controller");

// GET /api/applications — list with filters, sort, pagination
router.get("/", verifyToken, getApplications);

// POST /api/applications — create new (validate body first)
router.post("/", verifyToken, validate(applicationSchema), createApplication);

// GET /api/applications/:id — get one by id
router.get("/:id", verifyToken, getApplication);

// PATCH /api/applications/:id — partial update
router.patch("/:id", verifyToken, updateApplication);

// DELETE /api/applications/:id — soft delete
router.delete("/:id", verifyToken, deleteApplication);

module.exports = router;
