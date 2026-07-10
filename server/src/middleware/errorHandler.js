/**
 * src/middleware/errorHandler.js
 *
 * Global error handler — the last middleware in the Express chain.
 * Any route that does: next(new Error("something")) ends up here.
 *
 * Why a centralized handler?
 * Instead of try/catch + res.status(500).json(...) in every route,
 * we throw/forward errors to one place. This keeps route code clean
 * and ensures consistent error shape across the entire API.
 *
 * 🎯 Interview note: Express identifies error-handling middleware by its
 * 4-argument signature: (err, req, res, next). If you only have 3 args,
 * Express treats it as a regular middleware, not an error handler.
 */

const errorHandler = (err, req, res, next) => {
  // Log the full error in development so we can debug — never in production
  if (process.env.NODE_ENV === "development") {
    console.error("[ErrorHandler]", err);
  }

  // Map Prisma known query error codes to HTTP status codes
  if (err.code === "P2002") {
    const target = err.meta?.target || "Field";
    return res.status(409).json({ error: `Duplicate entry: ${target} already exists.` });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Requested resource not found." });
  }

  // If a statusCode was attached to the error object, use it — otherwise 500
  const statusCode = err.statusCode || err.status || 500;

  // In production, don't leak internal error messages for 500s
  const message =
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Something went wrong";

  res.status(statusCode).json({
    error: message,
    // Only include stack trace in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
