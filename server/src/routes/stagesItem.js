// src/routes/stagesItem.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const { updateStage, deleteStage } = require("../controllers/stages.controller");

router.patch("/:id", verifyToken, updateStage);
router.delete("/:id", verifyToken, deleteStage);

module.exports = router;
