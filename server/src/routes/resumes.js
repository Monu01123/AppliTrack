// src/routes/resumes.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const { getResumes, createResume, deleteResume } = require("../controllers/resumes.controller");

router.get("/", verifyToken, getResumes);
router.post("/", verifyToken, createResume);
router.delete("/:id", verifyToken, deleteResume);

module.exports = router;
