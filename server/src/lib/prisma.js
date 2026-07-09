// src/lib/prisma.js — Prisma Client Singleton
//
// Why a singleton?
// PrismaClient opens a connection pool to the database when created.
// If you do "new PrismaClient()" in every file, you'd open a new pool
// each time — on Neon's free tier that means hitting the 10-connection limit fast.
//
// The fix: create ONE instance here and export it.
// Every other file imports this same instance.
//
// 🎯 The "global" trick below is for hot-reload in development:
// When nodemon restarts, Node.js re-runs all files — but "global" persists
// across restarts. Without this, each nodemon restart would leak a connection.

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
