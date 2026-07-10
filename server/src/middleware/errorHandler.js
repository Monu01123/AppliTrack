/**
 * Centralized global error handler middleware.
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
