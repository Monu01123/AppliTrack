/**
 * src/index.js — Entry point
 *
 * Responsibilities:
 *  1. Load environment variables
 *  2. Configure and mount all middleware
 *  3. Mount route stubs (routes will be filled in as we build features)
 *  4. Start the HTTP server
 */

// ─── 1. LOAD ENV VARS ────────────────────────────────────────────────────────
// dotenv reads the .env file and injects every key into process.env
// MUST be the very first import so every module below can access process.env
require("dotenv").config();
require("dns").setDefaultResultOrder("ipv4first");

// ─── 2. THIRD-PARTY IMPORTS ──────────────────────────────────────────────────
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");

// ─── 3. INTERNAL IMPORTS ─────────────────────────────────────────────────────
const errorHandler = require("./middleware/errorHandler");

// ─── 4. INIT APP ─────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ─── 5. SECURITY MIDDLEWARE ──────────────────────────────────────────────────

/**
 * helmet()
 * Sets ~14 security-related HTTP response headers automatically.
 * For example: X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security.
 * Rule: Always put helmet() first — before any other middleware or routes.
 *
 * 🎯 Interview note: "What does helmet do?" → It sets security headers that
 * protect against common attacks like clickjacking, MIME sniffing, and XSS.
 */
app.use(helmet());

/**
 * cors()
 * Controls which origins (domains) are allowed to make cross-origin requests.
 * Without this, browsers block fetch/axios calls from localhost:3000 → localhost:5000.
 *
 * credentials: true — Required so the browser sends cookies (our refresh token)
 * with cross-origin requests. Without this, httpOnly cookies are silently dropped.
 *
 * 🎯 Interview note: "Why credentials:true?" → Browsers block cookies on
 * cross-origin requests by default. This header opts in, but it requires the
 * origin to be explicitly named (not '*').
 */
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true, // Allows cookies to be sent with cross-origin requests
  })
);

/**
 * express-rate-limit (global limiter)
 * Counts requests per IP and blocks if they exceed windowMs / max.
 * This is a coarse global guard — we'll add tighter per-route limits later
 * (e.g., 10 AI calls/user/day on the Gemini endpoint).
 *
 * windowMs: 15 minutes, max: 100 requests per window per IP.
 *
 * 🎯 Interview note: "Where do you store rate limit state in production?"
 * → By default it's in-memory (lost on restart). For multi-server setups you
 * need a shared store like Redis (e.g., rate-limit-redis package).
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 100,                  // Max requests per IP per window
  standardHeaders: true,     // Returns rate limit info in RateLimit-* headers
  legacyHeaders: false,      // Disables deprecated X-RateLimit-* headers
  message: {
    error: "Too many requests from this IP, please try again after 15 minutes.",
  },
});
app.use(globalLimiter);

// ─── 6. PARSING MIDDLEWARE ───────────────────────────────────────────────────

/**
 * express.json()
 * Parses incoming requests with JSON bodies (Content-Type: application/json)
 * and exposes the parsed result as req.body.
 * limit: '10kb' — Prevents payload attacks (someone sending a 100MB JSON body).
 */
app.use(express.json({ limit: "10kb" }));

/**
 * cookie-parser
 * Parses the Cookie header and populates req.cookies with an object.
 * We need this to read our httpOnly refresh token cookie in the auth routes.
 */
app.use(cookieParser());

// ─── 7. ROUTES ───────────────────────────────────────────────────────────────
// Route stubs — we'll replace these with real router files as we build.
// The pattern: app.use("/api/resource", require("./routes/resource"))

app.get("/api/health", (req, res) => {
  // Health check endpoint — used by Docker, Render, and load balancers
  // to verify the server is alive without hitting the database.
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Placeholder — will be replaced with: require("./routes/applications")
app.use("/api/applications", require("./routes/applications"));
app.use("/api/auth", require("./routes/auth"));

app.use("/api/ai", require("./routes/ai"));

app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/reminders", require("./routes/reminders"));

// 404 handler — catches any route that didn't match above
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── 8. GLOBAL ERROR HANDLER ─────────────────────────────────────────────────
// MUST be last. Express knows this is an error handler because it has 4 args.
// Any route that calls next(err) lands here.
app.use(errorHandler);

const { startCronJobs } = require("./lib/cron");

// ─── 9. START SERVER ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  startCronJobs();
});
