// src/controllers/analytics.controller.js
//
// Calculates job search funnel statistics using database aggregation (groupBy).
// Formats the output specifically for Recharts graphs on the frontend!

const prisma = require("../lib/prisma");

// Recommended color palette for Recharts bar & pie charts
const STATUS_COLORS = {
  APPLIED:      "#3b82f6",  // Blue (initial application)
  PHONE_SCREEN: "#8b5cf6",  // Purple (recruiter call)
  OA_RECEIVED:  "#06b6d4",  // Cyan (online assessment)
  INTERVIEW:    "#f59e0b",  // Amber (technical / hiring manager rounds)
  OFFER:        "#10b981",  // Green (success!)
  REJECTED:     "#ef4444",  // Red (closed)
  GHOSTED:      "#64748b",  // Slate Gray (no response)
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

    const allApps = await prisma.application.findMany({
      where: { userId: req.userId, deletedAt: null },
      select: { tags: true },
    });

    const tagMap = {};
    allApps.forEach((app) => {
      (app.tags || []).forEach((t) => {
        tagMap[t] = (tagMap[t] || 0) + 1;
      });
    });

    const tagCounts = Object.entries(tagMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    const goalStats = await calculateGoalStats(req.userId);

    res.json({
      total,
      byStatus,
      responseRate,
      interviewRate,
      offerRate,
      tagCounts,
      goals: goalStats,
    });

  } catch (err) {
    next(err);
  }
};

const calculateGoalStats = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dailyTarget: true },
  });
  const dailyTarget = user?.dailyTarget || 3;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const applicationsToday = await prisma.application.count({
    where: {
      userId,
      deletedAt: null,
      appliedAt: { gte: startOfToday },
    },
  });

  const recentApps = await prisma.application.findMany({
    where: { userId, deletedAt: null },
    select: { appliedAt: true },
    orderBy: { appliedAt: "desc" },
  });

  const activeDates = new Set(
    recentApps.map((a) => {
      const d = new Date(a.appliedAt);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })
  );

  let streakDays = 0;
  let checkDate = new Date(startOfToday);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (!activeDates.has(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dtStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
    if (activeDates.has(dtStr)) {
      streakDays++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    dailyTarget,
    applicationsToday,
    streakDays,
  };
};

const getGoalStats = async (req, res, next) => {
  try {
    const stats = await calculateGoalStats(req.userId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

const updateDailyTarget = async (req, res, next) => {
  try {
    const { dailyTarget } = req.body;
    const targetVal = Number(dailyTarget);
    if (!Number.isInteger(targetVal) || targetVal < 1 || targetVal > 50) {
      return res.status(400).json({ error: "Daily target must be between 1 and 50 applications." });
    }

    await prisma.user.update({
      where: { id: req.userId },
      data: { dailyTarget: targetVal },
    });

    const updatedStats = await calculateGoalStats(req.userId);
    res.json(updatedStats);
  } catch (err) {
    next(err);
  }
};

const { sendWeeklyDigestEmail } = require("../lib/mailer");

const sendWeeklyDigest = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true, name: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [total, newThisWeek, interviews, offers] = await Promise.all([
      prisma.application.count({ where: { userId: req.userId, deletedAt: null } }),
      prisma.application.count({
        where: { userId: req.userId, deletedAt: null, appliedAt: { gte: sevenDaysAgo } },
      }),
      prisma.application.count({
        where: { userId: req.userId, deletedAt: null, status: "INTERVIEW" },
      }),
      prisma.application.count({
        where: { userId: req.userId, deletedAt: null, status: "OFFER" },
      }),
    ]);

    const stats = { total, newThisWeek, interviews, offers };

    await sendWeeklyDigestEmail({
      to: user.email,
      name: user.name,
      stats,
    });

    res.json({
      success: true,
      message: "Weekly progress email digest generated and sent!",
      stats,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnalyticsSummary,
  sendWeeklyDigest,
  getGoalStats,
  updateDailyTarget,
};
