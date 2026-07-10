// src/controllers/stages.controller.js
//
// Controller for Interview Stage Timeline & Round-by-Round Notes.
// Handles adding, updating, and deleting individual interview rounds for an application.

const prisma = require("../lib/prisma");

// GET /api/applications/:applicationId/stages
const getStages = async (req, res, next) => {
  try {
    const { applicationId } = req.params;

    // Verify application belongs to user
    const app = await prisma.application.findFirst({
      where: { id: applicationId, userId: req.userId, deletedAt: null },
    });
    if (!app) {
      return res.status(404).json({ error: "Application not found" });
    }

    const stages = await prisma.applicationStage.findMany({
      where: { applicationId },
      orderBy: { roundOrder: "asc" },
    });

    res.json(stages);
  } catch (err) {
    next(err);
  }
};

// POST /api/applications/:applicationId/stages
const addStage = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { stageName, interviewDate, interviewer, notes, passed, roundOrder } = req.body;

    if (!stageName) {
      return res.status(400).json({ error: "stageName is required" });
    }

    const app = await prisma.application.findFirst({
      where: { id: applicationId, userId: req.userId, deletedAt: null },
    });
    if (!app) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Auto-calculate roundOrder if not provided
    let finalOrder = Number(roundOrder);
    if (!finalOrder || isNaN(finalOrder)) {
      const count = await prisma.applicationStage.count({ where: { applicationId } });
      finalOrder = count + 1;
    }

    const newStage = await prisma.applicationStage.create({
      data: {
        applicationId,
        stageName,
        interviewDate: interviewDate ? new Date(interviewDate) : null,
        interviewer: interviewer || null,
        notes: notes || null,
        passed: passed === undefined ? null : Boolean(passed),
        roundOrder: finalOrder,
      },
    });

    res.status(201).json(newStage);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/stages/:id
const updateStage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stageName, interviewDate, interviewer, notes, passed, roundOrder } = req.body;

    // Verify ownership via application
    const stage = await prisma.applicationStage.findUnique({
      where: { id },
      include: { application: true },
    });
    if (!stage || stage.application.userId !== req.userId || stage.application.deletedAt) {
      return res.status(404).json({ error: "Stage not found" });
    }

    const updated = await prisma.applicationStage.update({
      where: { id },
      data: {
        ...(stageName !== undefined && { stageName }),
        ...(interviewDate !== undefined && { interviewDate: interviewDate ? new Date(interviewDate) : null }),
        ...(interviewer !== undefined && { interviewer }),
        ...(notes !== undefined && { notes }),
        ...(passed !== undefined && { passed: passed === null ? null : Boolean(passed) }),
        ...(roundOrder !== undefined && { roundOrder: Number(roundOrder) }),
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/stages/:id
const deleteStage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const stage = await prisma.applicationStage.findUnique({
      where: { id },
      include: { application: true },
    });
    if (!stage || stage.application.userId !== req.userId || stage.application.deletedAt) {
      return res.status(404).json({ error: "Stage not found" });
    }

    await prisma.applicationStage.delete({ where: { id } });

    res.json({ success: true, message: "Stage deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStages,
  addStage,
  updateStage,
  deleteStage,
};
