// src/pages/ResumesPage.jsx
//
// Resume Manager — upload PDF/DOCX files, view, download, and delete saved resumes.
// Files are stored in AWS S3. Text is extracted server-side for AI scoring.

import React, { useState, useEffect, useRef } from "react";
import { Upload, Trash2, Download, FileText, Plus, Loader2, AlertCircle } from "lucide-react";
import api from "../lib/api";

export const ResumesPage = () => {
  const [resumes, setResumes]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [label, setLabel]           = useState("");
  const [file, setFile]             = useState(null);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");
  const [downloading, setDownloading] = useState(null); // id of resume being downloaded
  const fileInputRef = useRef(null);

  // ── Fetch saved resumes on mount ──────────────────────────────────────────
  const fetchResumes = async () => {
    try {
      const res = await api.get("/resumes");
      setResumes(res.data || []);
    } catch (err) {
      setError("Failed to load resumes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResumes(); }, []);

  // ── Upload handler ────────────────────────────────────────────────────────
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { setError("Please select a PDF or DOCX file."); return; }
    if (!label.trim()) { setError("Please enter a label for this resume."); return; }

    setError(""); setSuccess(""); setUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("label", label.trim());

      const res = await api.post("/resumes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResumes((prev) => [res.data, ...prev]);
      setLabel(""); setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSuccess("Resume uploaded successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── Download handler ──────────────────────────────────────────────────────
  const handleDownload = async (id) => {
    setDownloading(id);
    try {
      const res = await api.get(`/resumes/${id}/download`);
      // Open the pre-signed S3 URL in a new tab — browser will auto-download
      window.open(res.data.url, "_blank");
    } catch (err) {
      setError("Failed to generate download link. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this resume? Any applications linked to it will be unlinked.")) return;
    try {
      await api.delete(`/resumes/${id}`);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError("Failed to delete resume.");
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="tape-label" style={{ marginBottom: "0.4rem" }}>my files</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
          Resume Manager
        </h1>
        <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem", color: "var(--grey)", marginTop: "0.4rem" }}>
          Upload PDF or DOCX resumes. Link them to applications. AI scoring uses them automatically.
        </p>
      </div>

      {/* ── Error / Success Banners ── */}
      {error && (
        <div style={{ background: "rgba(178,58,47,0.08)", border: "1px solid rgba(178,58,47,0.25)", borderRadius: 2, padding: "0.65rem 1rem", marginBottom: "1rem", fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "var(--string)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}
      {success && (
        <div style={{ background: "rgba(74,124,89,0.1)", border: "1px solid rgba(74,124,89,0.3)", borderRadius: 2, padding: "0.65rem 1rem", marginBottom: "1rem", fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "var(--stamp-green)" }}>
          ✓ {success}
        </div>
      )}

      {/* ── Upload Form ── */}
      <div className="cork-card-flat" style={{ marginBottom: "2rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <div className="tape-label" style={{ marginBottom: "0.3rem" }}>upload new</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
            Add Resume ({resumes.length}/5)
          </h2>
        </div>

        <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {/* Label input */}
          <div>
            <label style={{ fontFamily: "var(--font-ui)", fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--grey)", display: "block", marginBottom: "0.35rem" }}>
              Resume Label *
            </label>
            <input
              type="text"
              placeholder='e.g. "Frontend Engineer v2" or "Fullstack Resume"'
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="cork-input no-icon"
              maxLength={60}
            />
          </div>

          {/* File input */}
          <div>
            <label style={{ fontFamily: "var(--font-ui)", fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--grey)", display: "block", marginBottom: "0.35rem" }}>
              File * (PDF or DOCX, max 5 MB)
            </label>
            <div
              style={{ border: "2px dashed rgba(31,28,23,0.2)", borderRadius: 3, padding: "1.5rem", textAlign: "center", cursor: "pointer", background: file ? "rgba(74,124,89,0.06)" : "var(--card)", transition: "background 0.15s" }}
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <FileText size={18} style={{ color: "var(--stamp-green)" }} />
                  <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem", color: "var(--ink)", fontWeight: 600 }}>{file.name}</span>
                  <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", color: "var(--grey)" }}>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              ) : (
                <div>
                  <Upload size={24} style={{ color: "var(--grey)", margin: "0 auto 0.5rem" }} />
                  <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "var(--grey)", margin: 0 }}>
                    Click to select a <strong>.pdf</strong> or <strong>.docx</strong> file
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                style={{ display: "none" }}
                onChange={(e) => { setFile(e.target.files[0] || null); setError(""); }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={uploading || resumes.length >= 5}
              className="btn-cork"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              {uploading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={14} />}
              {uploading ? "Uploading & Extracting Text…" : "Upload Resume"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Saved Resumes List ── */}
      <div>
        <div className="tape-label" style={{ marginBottom: "0.75rem" }}>saved resumes</div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--grey)", fontFamily: "var(--font-hand)" }}>
            Loading resumes…
          </div>
        ) : resumes.length === 0 ? (
          <div className="cork-card-flat" style={{ textAlign: "center", padding: "3rem" }}>
            <FileText size={32} style={{ color: "var(--grey)", margin: "0 auto 0.75rem" }} />
            <p style={{ fontFamily: "var(--font-hand)", fontSize: "1rem", color: "var(--grey)", margin: 0 }}>
              No resumes uploaded yet. Add your first one above!
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {resumes.map((resume, i) => (
              <div
                key={resume.id}
                className={`cork-card-flat ${i % 2 === 0 ? "cork-card-r1" : "cork-card-r2"}`}
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                {/* Icon */}
                <div style={{ width: 40, height: 40, borderRadius: 2, background: resume.mimeType?.includes("pdf") ? "rgba(178,58,47,0.1)" : "rgba(37,99,235,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileText size={18} style={{ color: resume.mimeType?.includes("pdf") ? "var(--string)" : "var(--stamp-blue)" }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem", fontWeight: 700, color: "var(--ink)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {resume.label}
                  </p>
                  <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "var(--grey)", margin: 0 }}>
                    {resume.mimeType?.includes("pdf") ? "PDF" : "DOCX"} · Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <button
                    onClick={() => handleDownload(resume.id)}
                    disabled={downloading === resume.id}
                    className="btn-cork-outline"
                    style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
                    title="Download"
                  >
                    {downloading === resume.id
                      ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                      : <Download size={13} />}
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(resume.id)}
                    className="btn-icon btn-icon-danger"
                    title="Delete resume"
                    style={{ padding: "0.4rem" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
