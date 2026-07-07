// src/middleware/validate.js
//
// Zod is a validation library. You define a "schema" (rules for your data),
// then call schema.parse(data) — if data breaks the rules, Zod throws an error.
//
// This file has two things:
//   1. The validation schemas (the rules)
//   2. A reusable middleware that runs Zod before a route handler executes

const { z } = require("zod");

// ─── AUTH SCHEMAS ─────────────────────────────────────────────────────────────

// Rules for POST /api/auth/register
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Rules for POST /api/auth/login
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Rules for POST /api/applications
// .optional() means the field can be missing from req.body entirely
const applicationSchema = z.object({
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  status: z
    .enum(["APPLIED", "PHONE_SCREEN", "INTERVIEW", "OFFER", "REJECTED", "GHOSTED"])
    .optional(),
  jdUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  jdText: z.string().optional(),
  notes: z.string().optional(),
});

// Rules for PATCH /api/applications/:id
// .partial() makes all fields optional so you can update just one field (e.g. status) without sending company/role again!
const updateApplicationSchema = applicationSchema.partial();

// ─── VALIDATE MIDDLEWARE ──────────────────────────────────────────────────────
//
// This is a "middleware factory" — a function that RETURNS a middleware.
// Usage in routes: router.post("/register", validate(registerSchema), controller)
//
// How it works:
//   1. schema.safeParse(req.body) — tries to validate without throwing
//   2. If it fails → send 400 with the error messages
//   3. If it passes → call next() to run the actual route handler

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    // result.error.errors is an array of issues, e.g.:
    // [{ path: ["email"], message: "Invalid email address" }]
    const errors = result.error.errors.map((e) => ({
      field: e.path[0],   // which field failed (e.g. "email")
      message: e.message, // what went wrong
    }));

    return res.status(400).json({ error: "Validation failed", errors });
  }

  // Attach validated (and sanitized) data back to req.body
  // This ensures downstream code uses the clean parsed version
  req.body = result.data;
  next();
};

module.exports = { validate, registerSchema, loginSchema, applicationSchema, updateApplicationSchema };
