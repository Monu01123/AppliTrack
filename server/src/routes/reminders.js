// src/routes/reminders.js
//
// Routes for managing automated follow-up reminders.
// Protected by verifyToken so users only manage their own reminders.

const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken.js")

const { validate, reminderSchema } = require("../middleware/validate.js")


const { createReminder, getReminders, deleteReminder } = require("../controllers/reminders.controller.js");

router.post("/", verifyToken, validate(reminderSchema), createReminder);
router.get("/", verifyToken, getReminders);
router.delete("/:id", verifyToken, deleteReminder);

module.exports = router;
