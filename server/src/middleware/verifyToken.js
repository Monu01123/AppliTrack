// src/middleware/verifyToken.js
//
// This middleware runs BEFORE any protected route handler.
// It checks that the request has a valid JWT access token.
// If valid → attaches userId to req so controllers can use it.
// If invalid → sends 401 immediately, route handler never runs.
//
// Usage in routes:
//   router.get("/me", verifyToken, getMe)
//   router.post("/applications", verifyToken, createApplication)

const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") return res.status(401).json({
      error: "Token expired"
    });
    if (error.name === "JsonWebTokenError") return res.status(401).json({
      error: "Invalid token"
    });
    next(error);
  }
};

module.exports = verifyToken;
