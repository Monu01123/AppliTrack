// src/controllers/analytics.controller.js
//
// Calculates job search funnel statistics using database aggregation (groupBy).
// Formats the output specifically for Recharts graphs on the frontend!

const prisma = require("../lib/prisma");

// Recommended color palette for Recharts bar & pie charts
const STATUS_COLORS = {
  APPLIED: "#3b82f6",      // Blue (initial application)
  PHONE_SCREEN: "#8b5cf6", // Purple (recruiter call)
  INTERVIEW: "#f59e0b",    // Amber (technical / hiring manager rounds)
  OFFER: "#10b981",        // Green (success!)
  REJECTED: "#ef4444",     // Red (closed)
  GHOSTED: "#64748b",      // Slate Gray (no response)
};



const getAnalyticsSummary = async (req, res, next) => {
  try {
    const statusCounts = await prisma.application.groupBy({
      by: ["status"],
      where: {
        userId: req.userId,
        deletedAt: null,
      },
      _count: {
        status: true,
      },
    });

    const total = await prisma.application.count({
      where: {
        userId: req.userId,
        deletedAt: null,
      },
    });

    const byStatus = Object.keys(STATUS_COLORS).map((status) => {
      const countObj = statusCounts.find((c) => c.status === status);
      const count = countObj ? countObj._count.status : 0;
      return { name: status, count, fill: STATUS_COLORS[status] };
    });


    const appliedCount = byStatus.find((s) => s.name === "APPLIED")?.count || 0;
    const ghostedCount = byStatus.find((s) => s.name === "GHOSTED")?.count || 0;
    const interviewCount = byStatus.find((s) => s.name === "INTERVIEW")?.count || 0;
    const offerCount = byStatus.find((s) => s.name === "OFFER")?.count || 0;

    const responseRate = total === 0 ? "0.0%" : ((total - appliedCount - ghostedCount) / total * 100).toFixed(1) + "%";
    const interviewRate = total === 0 ? "0.0%" : ((interviewCount + offerCount) / total * 100).toFixed(1) + "%";
    const offerRate = total === 0 ? "0.0%" : (offerCount / total * 100).toFixed(1) + "%";

    res.json({
      total,
      byStatus,
      responseRate,
      interviewRate,
      offerRate,
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnalyticsSummary,
};
