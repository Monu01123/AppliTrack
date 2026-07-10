// src/routes/stages.js
const express = require("express");
const router = express.Router({ mergeParams: true });
const verifyToken = require("../middleware/verifyToken");
const { getStages, addStage, updateStage, deleteStage } = require("../controllers/stages.controller");

router.get("/", verifyToken, getStages);
router.post("/", verifyToken, addStage);

module.exports = router;
