// Singleton Prisma Client instance to prevent connection pool exhaustion during dev hot-reloads.

const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const { PrismaClient } = require("@prisma/client");

// In production: just create the client directly
// In development: reuse the one stored on "global" if it exists
const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
    //      ↑ In dev mode, logs every SQL query to the console so you can debug
  });

// Store it on global so nodemon hot-reload reuses the same instance
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

module.exports = prisma;
