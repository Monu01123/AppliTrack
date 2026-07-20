// src/controllers/resumes.controller.js
//
// Manages multiple resume versions per user (up to 5).
// Files (PDF / DOCX) are uploaded to AWS S3.
// Text is extracted server-side so Gemini AI can score them without extra steps.

const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const s3 = require("../lib/s3");
const prisma = require("../lib/prisma");

const BUCKET = process.env.AWS_S3_BUCKET;
const REGION = process.env.AWS_REGION || "ap-south-1";

// ─── MULTER CONFIG ─────────────────────────────────────────────────────────────
// Store files in memory (Buffer) — we stream them straight to S3, never to disk.
// This is memory-efficient for small files like resumes (< 5 MB).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    const name = file.originalname?.toLowerCase() || "";
    const mime = file.mimetype?.toLowerCase() || "";
    if (
      mime.includes("pdf") ||
      mime.includes("word") ||
      mime.includes("docx") ||
      mime.includes("msword") ||
      mime.includes("octet-stream") ||
      name.endsWith(".pdf") ||
      name.endsWith(".docx") ||
      name.endsWith(".doc")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX files are allowed."), false);
    }
  },
});

// ─── HELPER: Extract text from uploaded file buffer ────────────────────────────
const extractText = async (buffer, mimetype, originalname = "") => {
  const mime = (mimetype || "").toLowerCase();
  const name = (originalname || "").toLowerCase();

  if (mime.includes("pdf") || name.endsWith(".pdf")) {
    try {
      const data = await pdfParse(buffer);
      return data?.text || "";
    } catch (pdfErr) {
      console.warn("pdf-parse encountered an issue while extracting text:", pdfErr.message);
      return "";
    }
  }
  if (mime.includes("word") || mime.includes("docx") || mime.includes("msword") || name.endsWith(".docx") || name.endsWith(".doc")) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result?.value || "";
    } catch (docErr) {
      console.warn("mammoth encountered an issue while extracting text:", docErr.message);
      return "";
    }
  }
  return "";
};

// ─── GET ALL RESUMES ──────────────────────────────────────────────────────────
// GET /api/resumes
// PERFORMANCE: We deliberately DO NOT return extractedText here.
// The Kanban board only needs id + label + fileUrl to show the resume name.
// extractedText is only fetched when the AI scorer needs it.
const getResumes = async (req, res, next) => {
  try {
    const resumes = await prisma.resume.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        label: true,
        fileUrl: true,
        mimeType: true,
        createdAt: true,
      },
    });
    res.json(resumes);
  } catch (err) {
    next(err);
  }
};

// ─── UPLOAD RESUME ────────────────────────────────────────────────────────────
// POST /api/resumes/upload  (multipart/form-data)
// Expects form field "resume" (the file) and "label" (string).
// Uploads to S3, extracts text, creates DB record.
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided. Please attach a PDF or DOCX file." });
    }
    const { label } = req.body;
    if (!label || !label.trim()) {
      return res.status(400).json({ error: "A resume label is required." });
    }

    // 1. Extract plain text from the file buffer for AI scoring
    let extractedText = "";
    try {
      extractedText = await extractText(req.file.buffer, req.file.mimetype, req.file.originalname);
    } catch (extractErr) {
      console.warn("Text extraction issue:", extractErr.message);
    }

    if (!extractedText || !extractedText.trim()) {
      extractedText = `[Attached file: ${req.file.originalname} - Text extraction unavailable or visual PDF]`;
    }

    // 2. Build a unique S3 key: resumes/<userId>/<timestamp>-<filename>
    const fileKey = `resumes/${req.userId}/${Date.now()}-${req.file.originalname.replace(/\s+/g, "_")}`;

    // 3. Upload the original file to S3
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: fileKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        // Note: No ACL "public-read" — we use pre-signed URLs for secure downloads
      })
    );

    const fileUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${fileKey}`;

    // 4. Save resume metadata + extracted text to database
    const resume = await prisma.resume.create({
      data: {
        userId: req.userId,
        label: label.trim(),
        fileUrl,
        fileKey,
        extractedText,
        mimeType: req.file.mimetype,
      },
      select: { id: true, label: true, fileUrl: true, mimeType: true, createdAt: true },
    });

    res.status(201).json(resume);
  } catch (err) {
    next(err);
  }
};

// ─── DOWNLOAD RESUME ──────────────────────────────────────────────────────────
// GET /api/resumes/:id/download
// Returns a pre-signed URL valid for 5 minutes — secure, no public bucket needed.
const downloadResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resume = await prisma.resume.findFirst({
      where: { id, userId: req.userId },
      select: { fileKey: true, label: true, mimeType: true },
    });

    if (!resume) {
      return res.status(404).json({ error: "Resume not found." });
    }

    // Generate a pre-signed URL that expires in 5 minutes
    const ext = resume.mimeType.includes("pdf") ? "pdf" : "docx";
    // Sanitize to safe ASCII for the standard filename attribute
    const asciiLabel = resume.label.replace(/[^\x20-\x7E]/g, "-").replace(/["\\]/g, "");
    const utf8Label = encodeURIComponent(`${resume.label}.${ext}`);

    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: resume.fileKey,
      ResponseContentDisposition: `attachment; filename="${asciiLabel}.${ext}"; filename*=UTF-8''${utf8Label}`,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    res.json({ url: signedUrl });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE RESUME ────────────────────────────────────────────────────────────
// DELETE /api/resumes/:id
// Deletes from both S3 and the database.
const deleteResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resume = await prisma.resume.findFirst({
      where: { id, userId: req.userId },
    });

    if (!resume) {
      return res.status(404).json({ error: "Resume not found." });
    }

    // 1. Delete the file from S3 first
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: resume.fileKey }));

    // 2. Unlink any applications that were using this resume
    await prisma.application.updateMany({
      where: { resumeId: id, userId: req.userId },
      data: { resumeId: null },
    });

    // 3. Delete the DB record
    await prisma.resume.delete({ where: { id } });

    res.json({ message: "Resume deleted successfully." });
  } catch (err) {
    next(err);
  }
};

module.exports = { upload, getResumes, uploadResume, downloadResume, deleteResume };
