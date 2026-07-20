require("dotenv").config();
require("dns").setDefaultResultOrder("ipv4first");

// ─── 2. THIRD-PARTY IMPORTS ──────────────────────────────────────────────────
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const compression = require("compression");

// ─── 3. INTERNAL IMPORTS ─────────────────────────────────────────────────────
const errorHandler = require("./middleware/errorHandler");

// ─── 4. INIT APP ─────────────────────────────────────────────────────────────
const app = express();

// Trust reverse proxies (Nginx/Vercel) so rate-limiter doesn't crash
app.set("trust proxy", 1);

const PORT = process.env.PORT || 5000;

// ─── 5. SECURITY & PERFORMANCE MIDDLEWARE ─────────────────────────────────────

app.use(helmet());
app.use(compression());

const rawClientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const cleanClientUrl = rawClientUrl.endsWith("/") ? rawClientUrl.slice(0, -1) : rawClientUrl;

app.use(
  cors({
    origin: [
      cleanClientUrl,
      "https://appli-track-seven.vercel.app", // Explicitly allow current Vercel URL
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests from this IP, please try again after 15 minutes.",
  },
});
app.use(globalLimiter);

// ─── 6. PARSING MIDDLEWARE ───────────────────────────────────────────────────

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// ─── 7. ROUTES ───────────────────────────────────────────────────────────────

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

app.use("/api/applications", require("./routes/applications"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/reminders", require("./routes/reminders"));
app.use("/api/resumes", require("./routes/resumes"));
app.use("/api/stages", require("./routes/stagesItem"));
app.use("/api/public", require("./routes/public"));

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── 8. GLOBAL ERROR HANDLER ─────────────────────────────────────────────────
app.use(errorHandler);

const { startCronJobs } = require("./lib/cron");

// ─── 9. START SERVER ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  startCronJobs();
});
""