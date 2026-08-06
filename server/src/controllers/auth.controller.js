// src/controllers/auth.controller.js
//
// Controllers contain the actual business logic for each route.
// Routes just wire up "which URL → which controller function".
// Keeping them separate makes the code easier to read and test.

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const prisma = require("../lib/prisma");
const { sendVerificationEmail } = require("../lib/mailer");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// In-memory rate limit map for resend verification
const resendRateLimits = new Map();

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
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Explicitly tell the browser NOT to delete on exit
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

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create the user in the database
    const user = await prisma.user.create({
      data: { 
        name, 
        email, 
        password: hashedPassword,
        verificationToken,
      },
    });

    // Send verification email
    await sendVerificationEmail({
      to: user.email,
      token: verificationToken
    });

    // Send success response WITHOUT issuing JWT
    res.status(201).json({
      message: "Registration successful. Please check your email to verify your account."
    });
  } catch (err) {
    next(err); // Forward any unexpected errors to the global error handler
  }
};

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────
// GET /api/auth/verify-email?token=xxx

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: "Verification token is required" });
    }

    const user = await prisma.user.findFirst({
      where: { verificationToken: token }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired verification token" });
    }

    // Mark as verified and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
      }
    });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    res.redirect(`${clientUrl}/login?verified=true`);
  } catch (err) {
    next(err);
  }
};

// ─── RESEND VERIFICATION ──────────────────────────────────────────────────────
// POST /api/auth/resend-verification

const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    // Rate limiting: 10 minutes (600,000 ms)
    const lastSent = resendRateLimits.get(email);
    if (lastSent && Date.now() - lastSent < 600000) {
      return res.status(429).json({ error: "Please wait before requesting another email." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
    if (user.isVerified) {
      return res.status(400).json({ error: "Email is already verified" });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken }
    });

    await sendVerificationEmail({
      to: user.email,
      token: verificationToken
    });

    // Update rate limit cache
    resendRateLimits.set(email, Date.now());

    res.json({ message: "Verification email resent successfully." });
  } catch (err) {
    next(err);
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

    if (!user.isVerified) {
      return res.status(403).json({ 
        code: "EMAIL_NOT_VERIFIED", 
        error: "Please verify your email first." 
      });
    }

    // Compare the plaintext password against the stored hash
    // bcrypt.compare handles the salt automatically — no extra work needed
    // If user signed up via Google only, they have no password set
    if (!user.password) {
      return res.status(401).json({ error: "This account uses Google Sign-In. Please use the Google button to log in." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id, user.tokenVersion || 0);

    sendRefreshTokenCookie(res, refreshToken);

    res.json({
      accessToken,
      refreshToken, // Also return in JSON for non-web clients (e.g. Chrome Extension)
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

// ─── GOOGLE LOGIN ─────────────────────────────────────────────────────────────
// POST /api/auth/google
// Receives an ID token from the frontend, verifies it, and logs the user in.
// Automatically creates a user or links to an existing account via email.

const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: "Missing Google credential" });
    }

    // Verify the ID token securely with Google's public keys
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      // Pass the Client ID that we expect to ensure it matches
      audience: process.env.GOOGLE_CLIENT_ID, 
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    // Check if user exists by email
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // User exists! If they don't have a googleId linked yet, link it now.
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, isVerified: true }, // Automatically verify email
        });
      }
    } else {
      // Create a brand new user
      user = await prisma.user.create({
        data: {
          email,
          name: name || "Google User",
          googleId,
          isVerified: true, // Google already verified their email
        },
      });
    }

    // Generate JWTs
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id, user.tokenVersion || 0);

    sendRefreshTokenCookie(res, refreshToken);

    res.json({
      accessToken,
      refreshToken, // Also return in JSON for non-web clients
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Google Login Error:", err);
    res.status(401).json({ error: "Google authentication failed" });
  }
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// Reads the httpOnly cookie, verifies the refresh token, returns a new access token
// Frontend calls this automatically when an API request returns 401

const refresh = async (req, res, next) => {
  try {
    // Fallback to req.body.refreshToken for non-web clients (Chrome Extension)
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) {
      return res.status(401).json({ error: "No refresh token" });
    }

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    // Check that user exists and token version matches current tokenVersion
    if (!user || decoded.tokenVersion !== user.tokenVersion) {
      res.clearCookie("refreshToken", { 
        path: "/api/auth",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production"
      });
      return res.status(401).json({ error: "Session revoked or expired" });
    }

    // ROTATE: issue fresh access token AND rotate refresh token
    const accessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id, user.tokenVersion);

    sendRefreshTokenCookie(res, newRefreshToken);
    res.json({ accessToken, refreshToken: newRefreshToken });
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

module.exports = { register, login, googleLogin, refresh, logout, verifyEmail, resendVerification };
