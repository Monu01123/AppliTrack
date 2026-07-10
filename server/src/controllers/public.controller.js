// src/controllers/public.controller.js
//
// Handles shareable public profile viewing and toggle settings.
// Excludes sensitive fields like notes, job description text, and private URLs.

const prisma = require("../lib/prisma");

// GET /api/public/profile/:slugOrId
// Unauthenticated route for viewing a shareable public profile
const getPublicProfile = async (req, res, next) => {
  try {
    const { slugOrId } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: slugOrId },
          { profileSlug: slugOrId },
        ],
      },
      select: {
        id: true,
        name: true,
        profileSlug: true,
        publicProfileEnabled: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Candidate profile not found." });
    }

    if (!user.publicProfileEnabled) {
      return res.status(403).json({
        error: "This profile is private.",
        private: true,
      });
    }

    // Fetch sanitized applications (NO notes, NO jdText, NO jdUrl)
    const applications = await prisma.application.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { appliedAt: "desc" },
      select: {
        id: true,
        company: true,
        role: true,
        status: true,
        appliedAt: true,
        tags: true,
      },
    });

    const total = applications.length;
    const interviews = applications.filter((a) => a.status === "INTERVIEW").length;
    const offers = applications.filter((a) => a.status === "OFFER").length;

    res.json({
      user: {
        name: user.name,
        profileSlug: user.profileSlug,
        createdAt: user.createdAt,
      },
      stats: {
        total,
        interviews,
        offers,
      },
      applications,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/profile/public
// Authenticated route for toggling public profile & setting slug
const updatePublicProfileSettings = async (req, res, next) => {
  try {
    const { publicProfileEnabled, profileSlug } = req.body;

    let slugToSave = undefined;
    if (profileSlug !== undefined) {
      if (profileSlug === "" || profileSlug === null) {
        slugToSave = null;
      } else {
        const cleaned = String(profileSlug).toLowerCase().trim();
        if (!/^[a-z0-9-]+$/.test(cleaned)) {
          return res.status(400).json({
            error: "Profile slug can only contain lowercase letters, numbers, and hyphens.",
          });
        }
        // Check uniqueness if slug is changing
        const existing = await prisma.user.findFirst({
          where: {
            profileSlug: cleaned,
            NOT: { id: req.userId },
          },
        });
        if (existing) {
          return res.status(409).json({
            error: "That profile link is already taken. Please choose another.",
          });
        }
        slugToSave = cleaned;
      }
    }

    const data = {};
    if (typeof publicProfileEnabled === "boolean") {
      data.publicProfileEnabled = publicProfileEnabled;
    }
    if (slugToSave !== undefined) {
      data.profileSlug = slugToSave;
    }

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        publicProfileEnabled: true,
        profileSlug: true,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/profile/public
// Authenticated route to read current user's public profile settings
const getPublicProfileSettings = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        publicProfileEnabled: true,
        profileSlug: true,
      },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPublicProfile,
  updatePublicProfileSettings,
  getPublicProfileSettings,
};
