// src/controllers/applications.controller.js

const prisma = require("../lib/prisma");

// ─── GET ALL APPLICATIONS ─────────────────────────────────────────────────────
// GET /api/applications?status=APPLIED&sort=appliedAt&order=desc&page=1&limit=10
const getApplications = async (req, res, next) => {
  try {
    // Destructure query params — if not provided, use these defaults
    const { status, sort = "appliedAt", order = "desc", page = 1, limit = 10 } = req.query;

    // Build the WHERE clause dynamically
    // deletedAt: null → only return non-deleted applications (soft delete filter)
    const where = {
      userId: req.userId,   // 🔑 only fetch THIS user's applications
      deletedAt: null,      // 💡 soft delete: null means not deleted
    };

    // If a status filter was passed, add it to the where clause
    if (status) where.status = status;

    // Run both queries in parallel using Promise.all — faster than running one after another
    // 💡 Promise.all([p1, p2]) waits for BOTH to finish, then returns [result1, result2]
    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy: { [sort]: order },          // e.g. { appliedAt: "desc" }
        skip: (page - 1) * Number(limit),    // pagination: skip already-seen records
        take: Number(limit),                 // how many to return this page
      }),
      prisma.application.count({ where }),   // total count for pagination UI
    ]);

    res.json({
      data: applications,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    next(err);
  }
};

// ─── CREATE APPLICATION ───────────────────────────────────────────────────────
// POST /api/applications
const createApplication = async (req, res, next) => {
  try {
    const { company, role, status, jdUrl, jdText, notes } = req.body;

    const application = await prisma.application.create({
      data: {
        userId: req.userId,   // 🔑 link to the logged-in user
        company,
        role,
        status,               // defaults to APPLIED if not sent (set in Prisma schema)
        jdUrl,
        jdText,
        notes,
      },
    });

    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
};

// ─── GET SINGLE APPLICATION ───────────────────────────────────────────────────
// GET /api/applications/:id
const getApplication = async (req, res, next) => {
  try {
    const { id } = req.params;

    // findFirst (not findUnique) lets us filter by multiple conditions
    // This ensures a user can't access another user's application by guessing IDs
    const application = await prisma.application.findFirst({
      where: { id, userId: req.userId, deletedAt: null },
      include: { aiScores: true },  // also return the AI scores array
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json(application);
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE APPLICATION ───────────────────────────────────────────────────────
// PATCH /api/applications/:id
const updateApplication = async (req, res, next) => {
  try {
    const { id } = req.params;

    // First check it exists AND belongs to this user
    const existing = await prisma.application.findFirst({
      where: { id, userId: req.userId, deletedAt: null },
    });

    if (!existing) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Update only the fields sent in req.body (partial update = PATCH behavior)
    // 💡 PATCH vs PUT: PATCH updates partial fields, PUT replaces the whole resource
    const updated = await prisma.application.update({
      where: { id },
      data: req.body,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// ─── SOFT DELETE APPLICATION ──────────────────────────────────────────────────
// DELETE /api/applications/:id
// 🎯 Soft delete = set deletedAt timestamp instead of removing the row
// Why? Keeps history, allows undo, prevents accidental data loss
const deleteApplication = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.application.findFirst({
      where: { id, userId: req.userId, deletedAt: null },
    });

    if (!existing) {
      return res.status(404).json({ error: "Application not found" });
    }

    await prisma.application.update({
      where: { id },
      data: { deletedAt: new Date() },  // set to NOW — this is the soft delete
    });

    res.json({ message: "Application deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getApplications,
  createApplication,
  getApplication,
  updateApplication,
  deleteApplication,
};
