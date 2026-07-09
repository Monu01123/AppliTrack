// src/controllers/reminders.controller.js
//
// Controllers for scheduling, listing, and cancelling automated follow-up reminders.

const prisma = require("../lib/prisma");

// ─── 1. CREATE REMINDER ───────────────────────────────────────────────────────
// POST /api/reminders
const createReminder = async (req, res, next) => {
  try {
    const { applicationId, daysFromNow } = req.body;

    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId: req.userId, deletedAt: null },
    });
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const sendAt = new Date();
    sendAt.setDate(sendAt.getDate() + (daysFromNow || 7));

    const reminder = await prisma.reminder.create({
      data: { userId: req.userId, applicationId, sendAt },
    });

    res.status(201).json(reminder);
  } catch (err) {
    next(err);
  }
};

// ─── 2. LIST REMINDERS ────────────────────────────────────────────────────────
// GET /api/reminders
const getReminders = async (req, res, next) => {
  try {
    const reminders = await prisma.reminder.findMany({
      where: { userId: req.userId },
      include: {
        application: { select: { company: true, role: true, status: true } },
      },
      orderBy: { sendAt: "asc" },
    });

    res.json(reminders);
  } catch (err) {
    next(err);
  }
};

// ─── 3. DELETE REMINDER ───────────────────────────────────────────────────────
// DELETE /api/reminders/:id
const deleteReminder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.reminder.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Reminder not found" });
    }

    await prisma.reminder.delete({ where: { id } });

    res.json({ message: "Reminder cancelled successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReminder,
  getReminders,
  deleteReminder,
};
