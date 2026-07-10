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
      tag,                  // optional tag filter
    } = req.query;

    // Build the WHERE clause for Prisma
    // userId: req.userId       → only show THIS user's applications
    // deletedAt: null          → only show NOT soft-deleted applications
    // status                   → add filter only if the query param exists
    const where = {
      userId: req.userId,
      deletedAt: null,
      ...(status && { status }), // spread only if status exists
      ...(tag && { tags: { has: tag } }),
      // 💡 { ...( condition && { key: value } ) } is a common JS pattern
      //    if condition is falsy, it spreads nothing; if truthy, adds the key
    };

    // Run BOTH queries in parallel using Promise.all for better performance
    // Instead of: await query1, then await query2 (sequential — slower)
    const ALLOWED_SORT_COLUMNS = ["appliedAt", "company", "role", "status", "updatedAt"];
    const safeSort = ALLOWED_SORT_COLUMNS.includes(sort) ? sort : "appliedAt";
    const safeOrder = order?.toString().toLowerCase() === "asc" ? "asc" : "desc";
    const safeLimit = Math.min(Math.max(1, Number(limit) || 10), 100); // Max 100 per page
    const safePage = Math.max(1, Number(page) || 1);

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy: { [safeSort]: safeOrder },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        include: {
          stages: {
            orderBy: { roundOrder: "asc" },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    res.json({
      data: applications,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
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
    const { company, role, status, jdUrl, jdText, notes, tags, interviewDate } = req.body;

    const application = await prisma.application.create({
      data: {
        userId: req.userId, // 🔑 links this application to the logged-in user
        company,
        role,
        status,   // Prisma uses the enum — if undefined, defaults to "APPLIED" (from schema)
        jdUrl,
        jdText,
        notes,
        tags: tags || [],
        interviewDate: interviewDate ? new Date(interviewDate) : null,
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
          orderBy: { createdAt: "desc" },
        },
        stages: {
          orderBy: { roundOrder: "asc" },
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

    const updateData = { ...req.body };
    if (updateData.interviewDate !== undefined) {
      updateData.interviewDate = updateData.interviewDate
        ? new Date(updateData.interviewDate)
        : null;
    }

    // Update only the fields present in req.body
    // Prisma ignores keys that aren't in your schema, so req.body is safe here
    const updated = await prisma.application.update({
      where: { id },
      data: updateData,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// Soft delete application by setting deletedAt timestamp

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

// ─── EXPORT APPLICATIONS (CSV / JSON) ─────────────────────────────────────────
// GET /api/applications/export?format=csv|json
const exportApplications = async (req, res, next) => {
  try {
    const { format = "csv" } = req.query;

    const applications = await prisma.application.findMany({
      where: { userId: req.userId, deletedAt: null },
      orderBy: { appliedAt: "desc" },
    });

    if (format.toLowerCase() === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="hireiq-applications-${new Date().toISOString().slice(0, 10)}.json"`);
      return res.send(JSON.stringify(applications, null, 2));
    }

    // CSV format
    const headers = ["ID", "Company", "Role", "Status", "Applied At", "Interview Date", "Tags", "Notes", "Job Description URL"];
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = Array.isArray(val) ? val.join("; ") : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = applications.map((app) => [
      escapeCsv(app.id),
      escapeCsv(app.company),
      escapeCsv(app.role),
      escapeCsv(app.status),
      escapeCsv(app.appliedAt ? new Date(app.appliedAt).toISOString().slice(0, 10) : ""),
      escapeCsv(app.interviewDate ? new Date(app.interviewDate).toISOString() : ""),
      escapeCsv(app.tags),
      escapeCsv(app.notes),
      escapeCsv(app.jdUrl),
    ].join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="hireiq-applications-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csvContent);
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
  exportApplications,
};
