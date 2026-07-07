// src/controllers/applications.controller.js

const prisma = require("../lib/prisma");

// ─── GET ALL APPLICATIONS ─────────────────────────────────────────────────────
// GET /api/applications?status=APPLIED&sort=appliedAt&order=desc&page=1&limit=10

const getApplications = async (req, res, next) => {
  try {
    // Destructure query params — provide defaults if the user doesn't send them
    // req.query values are always strings, so we convert page/limit to Number later
    const {
      status,               // optional filter e.g. "APPLIED"
      sort = "appliedAt",   // which column to sort by
      order = "desc",       // sort direction
      page = 1,             // current page
      limit = 10,           // items per page
    } = req.query;

    // Build the WHERE clause for Prisma
    // userId: req.userId       → only show THIS user's applications
    // deletedAt: null          → only show NOT soft-deleted applications
    // status                   → add filter only if the query param exists
    const where = {
      userId: req.userId,
      deletedAt: null,
      ...(status && { status }), // spread only if status exists
      // 💡 { ...( condition && { key: value } ) } is a common JS pattern
      //    if condition is falsy, it spreads nothing; if truthy, adds the key
    };

    // Run BOTH queries in parallel using Promise.all for better performance
    // Instead of: await query1, then await query2 (sequential — slower)
    // We do:      await both at the same time (parallel — faster)
    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy: { [sort]: order },     // dynamic key: { appliedAt: "desc" }
        skip: (Number(page) - 1) * Number(limit), // skip records for pagination
        take: Number(limit),            // how many to return
      }),
      prisma.application.count({ where }), // total matching records (for frontend pagination)
    ]);

    res.json({
      data: applications,
      total,                            // total number of matching records
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)), // how many pages exist
    });
  } catch (err) {
    next(err);
  }
};

// ─── CREATE APPLICATION ───────────────────────────────────────────────────────
// POST /api/applications

const createApplication = async (req, res, next) => {
  try {
    // Zod already validated req.body, so we trust these values
    const { company, role, status, jdUrl, jdText, notes } = req.body;

    const application = await prisma.application.create({
      data: {
        userId: req.userId, // 🔑 links this application to the logged-in user
        company,
        role,
        status,   // Prisma uses the enum — if undefined, defaults to "APPLIED" (from schema)
        jdUrl,
        jdText,
        notes,
      },
    });

    res.status(201).json(application); // 201 Created
  } catch (err) {
    next(err);
  }
};

// ─── GET SINGLE APPLICATION ───────────────────────────────────────────────────
// GET /api/applications/:id

const getApplication = async (req, res, next) => {
  try {
    const { id } = req.params; // :id from the URL

    // findFirst (not findUnique) lets us filter by BOTH id AND userId
    // This prevents user A from reading user B's application by guessing an ID
    const application = await prisma.application.findFirst({
      where: { id, userId: req.userId, deletedAt: null },
      include: {
        aiScores: {
          orderBy: { createdAt: "desc" }, // most recent score first
        },
      },
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
// PATCH = partial update (only send the fields you want to change)
// PUT   = full replacement (send ALL fields) — we use PATCH for flexibility

const updateApplication = async (req, res, next) => {
  try {
    const { id } = req.params;

    // First check the application exists and belongs to this user
    // Without this, someone could send PATCH /applications/other-users-id
    const existing = await prisma.application.findFirst({
      where: { id, userId: req.userId, deletedAt: null },
    });

    if (!existing) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Update only the fields present in req.body
    // Prisma ignores keys that aren't in your schema, so req.body is safe here
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
//
// 🎯 Soft delete pattern: instead of removing the row from the database,
// we set "deletedAt" to the current timestamp. The row stays in the DB.
// Benefits:
//   - Users can "undo" a delete
//   - You keep analytics/history data
//   - Avoids accidental data loss
// All queries filter { deletedAt: null } to exclude soft-deleted records.

const deleteApplication = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.application.findFirst({
      where: { id, userId: req.userId, deletedAt: null },
    });

    if (!existing) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Set deletedAt = now — this "hides" the application from all queries
    await prisma.application.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ message: "Application deleted successfully" });
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
