// src/routes/resumes.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const {
  upload,
  getResumes,
  uploadResume,
  downloadResume,
  deleteResume,
} = require("../controllers/resumes.controller");

router.get("/", verifyToken, getResumes);

// Upload endpoint uses multer middleware to parse the multipart/form-data file
router.post("/upload", verifyToken, upload.single("resume"), uploadResume);

// Download generates a pre-signed S3 URL
router.get("/:id/download", verifyToken, downloadResume);

router.delete("/:id", verifyToken, deleteResume);

module.exports = router;
