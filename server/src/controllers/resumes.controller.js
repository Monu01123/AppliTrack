// src/controllers/resumes.controller.js
//
// Manages multiple resume versions per user (up to 5 saved resumes).

const prisma = require("../lib/prisma");

// ─── GET ALL RESUMES ──────────────────────────────────────────────────────────
// GET /api/resumes
const getResumes = async (req, res, next) => {
  try {
    const resumes = await prisma.resume.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(resumes);
  } catch (err) {
    next(err);
  }
};

// ─── CREATE RESUME ────────────────────────────────────────────────────────────
// POST /api/resumes
const createResume = async (req, res, next) => {
  try {
    const { label, content } = req.body;
    if (!label || !content) {
      return res.status(400).json({ error: "Label and content are required" });
    }

    // Check limit: max 5 resumes per user
    const count = await prisma.resume.count({
      where: { userId: req.userId },
    });

    if (count >= 5) {
      return res.status(400).json({
        error: "Maximum 5 resumes allowed per user. Please delete an older resume first.",
      });
    }

    const resume = await prisma.resume.create({
      data: {
        userId: req.userId,
        label,
        content,
      },
    });

    res.status(201).json(resume);
  } catch (err) {
    next(err);
  }
};

// ─── DELETE RESUME ────────────────────────────────────────────────────────────
// DELETE /api/resumes/:id
const deleteResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resume = await prisma.resume.findFirst({
      where: { id, userId: req.userId },
    });

    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    await prisma.resume.delete({
      where: { id },
    });

    res.json({ message: "Resume deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getResumes,
  createResume,
  deleteResume,
};
