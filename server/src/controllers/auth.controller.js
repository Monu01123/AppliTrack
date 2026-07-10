// src/controllers/auth.controller.js
//
// Controllers contain the actual business logic for each route.
// Routes just wire up "which URL → which controller function".
// Keeping them separate makes the code easier to read and test.

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// Generates a short-lived access token (15 minutes)
// The payload { userId } is embedded inside the token
// Anyone who has the token can decode the payload — but can't FAKE it without the secret
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },                           // payload — what we store inside the token
    process.env.ACCESS_TOKEN_SECRET,      // secret key — used to sign + verify
    { expiresIn: "15m" }                  // token becomes invalid after 15 minutes
  );
};

// Generates a long-lived refresh token (7 days)
// Stored in an httpOnly cookie — JavaScript on the frontend cannot read it
const generateRefreshToken = (userId, tokenVersion = 0) => {
  return jwt.sign(
    { userId, tokenVersion },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
};

// Sends the refresh token as an httpOnly cookie restricted to /api/auth path
const sendRefreshTokenCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Creates a new user, hashes their password, returns an access token

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body; // already validated by Zod middleware

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "Email already in use" });
      // 409 Conflict — the resource (email) already exists
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user in the database
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    // Generate both tokens
    // Generate both tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id, user.tokenVersion || 0);

    // Send refresh token as cookie (httpOnly — invisible to JS)
    sendRefreshTokenCookie(res, refreshToken);

    // Send access token in response body — frontend stores this in memory
    res.status(201).json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    next(err); // Forward any unexpected errors to the global error handler
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Verifies credentials, returns a new access token + sets refresh cookie

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    // IMPORTANT: use the same error message for wrong email OR wrong password.
    // Different messages ("user not found" vs "wrong password") leak information
    // to attackers — they could enumerate which emails are registered.
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare the plaintext password against the stored hash
    // bcrypt.compare handles the salt automatically — no extra work needed
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id, user.tokenVersion || 0);

    sendRefreshTokenCookie(res, refreshToken);

    res.json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// Reads the httpOnly cookie, verifies the refresh token, returns a new access token
// Frontend calls this automatically when an API request returns 401

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ error: "No refresh token" });
    }

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    // Check that user exists and token version matches current tokenVersion
    if (!user || decoded.tokenVersion !== user.tokenVersion) {
      res.clearCookie("refreshToken", { path: "/api/auth" });
      return res.status(401).json({ error: "Session revoked or expired" });
    }

    // ROTATE: issue fresh access token AND rotate refresh token
    const accessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id, user.tokenVersion);

    sendRefreshTokenCookie(res, newRefreshToken);
    res.json({ accessToken });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
    next(err);
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// Clears the refresh token cookie and increments tokenVersion to invalidate all existing refresh tokens

const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const decoded = jwt.decode(token);
      if (decoded?.userId) {
        await prisma.user.update({
          where: { id: decoded.userId },
          data: { tokenVersion: { increment: 1 } },
        });
      }
    }
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/auth",
    });
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, logout };
