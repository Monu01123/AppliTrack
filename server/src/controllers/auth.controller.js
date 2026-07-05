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
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
};

// Sends the refresh token as an httpOnly cookie
// httpOnly: true  → browser JS cannot access it (blocks XSS attacks)
// sameSite: lax   → cookie is sent on top-level navigations (good default)
// secure: true    → only sent over HTTPS (we check env so it works on localhost too)
const sendRefreshTokenCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
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

    // Hash the password
    // bcrypt.hash(plaintext, saltRounds) — saltRounds=10 is the industry standard
    // More rounds = slower hash = harder for attackers to brute-force
    // 🎯 bcrypt is one-way: you can VERIFY but never REVERSE a hash
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user in the database
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    // Generate both tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

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
    const refreshToken = generateRefreshToken(user.id);

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
    // cookie-parser makes the cookie available at req.cookies
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ error: "No refresh token" });
    }

    // jwt.verify throws if the token is expired or tampered with
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    // Optional: verify user still exists in DB (in case account was deleted)
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Issue a fresh access token
    const accessToken = generateAccessToken(user.id);

    res.json({ accessToken });
  } catch (err) {
    // jwt.verify throws JsonWebTokenError or TokenExpiredError
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
    next(err);
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// Clears the refresh token cookie — that's all it takes to "log out"

const logout = (req, res) => {
  // Clear the cookie by setting it to expire immediately
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  res.json({ message: "Logged out successfully" });
};

module.exports = { register, login, refresh, logout };
