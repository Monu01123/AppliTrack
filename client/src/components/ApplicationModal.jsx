// src/components/ApplicationModal.jsx
//
// Add / Edit Application modal — corkboard design system.
// Users can attach a resume PDF/DOCX directly in this form.

import React, { useState, useEffect, useRef } from "react";
import { X, Briefcase, Building2, FileText, Upload, Loader2 } from "lucide-react";
import { InterviewStagesTimeline } from "./InterviewStagesTimeline";
import api from "../lib/api";

const STATUS_OPTIONS = [
  { value: "APPLIED",      label: "Applied"      },
  { value: "PHONE_SCREEN", label: "Phone Screen" },
  { value: "INTERVIEW",    label: "Interview"    },
  { value: "OFFER",        label: "Offer"        },
  { value: "REJECTED",     label: "Rejected"     },
  { value: "GHOSTED",      label: "Ghosted"      },
];

const SUGGESTED_TAGS = ["Referral", "Cold Apply", "Dream Company", "Startup", "Remote"];

export const ApplicationModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const [company, setCompany]         = useState("");
  const [role, setRole]               = useState("");
  const [status, setStatus]           = useState("APPLIED");
  const [jdText, setJdText]           = useState("");
  const [notes, setNotes]             = useState("");
  const [tags, setTags]               = useState([]);
  const [tagInput, setTagInput]       = useState("");
  const [interviewDate, setInterviewDate] = useState("");

  // Resume state — user can upload a new file OR keep the existing one
  const [resumeFile, setResumeFile]         = useState(null);  // new file to upload
  const [existingResume, setExistingResume] = useState(null);  // already linked resume { id, label }
  const [uploadingResume, setUploadingResume] = useState(false);

  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState("");
  const fileInputRef = useRef(null);

  const formatDateTimeLocal = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    if (initialData) {
      setCompany(initialData.company || "");
      setRole(initialData.role || "");
      setStatus(initialData.status || "APPLIED");
      setJdText(initialData.jdText || "");
      setNotes(initialData.notes || "");
      setTags(initialData.tags || []);
      setInterviewDate(formatDateTimeLocal(initialData.interviewDate));
      setExistingResume(initialData.resume || null);
    } else {
      setCompany(""); setRole(""); setStatus("APPLIED");
      setJdText(""); setNotes(""); setTags([]); setInterviewDate("");
      setExistingResume(null);
    }
    setResumeFile(null);
    setTagInput(""); setFormError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [initialData, isOpen]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && isOpen) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddTag = (t) => {
    const clean = t.trim();
    if (clean && !tags.includes(clean)) setTags([...tags, clean]);
    setTagInput("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      let resumeId = existingResume?.id || null;

      // If the user selected a NEW resume file, upload it first
      if (resumeFile) {
        setUploadingResume(true);
        const formData = new FormData();
        formData.append("resume", resumeFile);
        // Use company + role as the auto-label so the user doesn't have to type it
        formData.append("label", `${company.trim() || "Resume"} — ${role.trim() || new Date().toLocaleDateString()}`);
        try {
          const res = await api.post("/resumes/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          resumeId = res.data.id;
        } catch (uploadErr) {
          setFormError(uploadErr.response?.data?.error || "Resume upload failed. Please try again.");
          setSubmitting(false);
          setUploadingResume(false);
          return;
        }
        setUploadingResume(false);
      }

      await onSave({
        company, role, status, jdText, notes, tags,
        interviewDate: interviewDate || null,
        resumeId,
      });
      onClose();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to save. Please check your inputs.");
    } finally {
      setSubmitting(false);
      setUploadingResume(false);
    }
  };

  const Label = ({ children, extra }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
      <label style={{ fontFamily: "var(--font-ui)", fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--grey)" }}>
        {children}
      </label>
      {extra}
    </div>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(31,28,23,0.45)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{ background: "var(--card)", borderRadius: 3, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", position: "relative", padding: "1.75rem" }}
      >
        {/* Close */}
        <button onClick={onClose} className="btn-icon" style={{ position: "absolute", top: "1rem", right: "1rem" }}>
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
          <Briefcase size={18} style={{ color: "var(--grey)" }} />
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
            {initialData ? "Edit Application" : "Track New Application"}
          </h2>
        </div>

        {/* Error */}
        {formError && (
          <div style={{ background: "rgba(178,58,47,0.08)", border: "1px solid rgba(178,58,47,0.25)", borderRadius: 2, padding: "0.6rem 0.875rem", marginBottom: "1rem", fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "var(--string)" }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Company */}
          <div>
            <Label>Company Name *</Label>
            <div style={{ position: "relative" }}>
              <Building2 size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--grey)", pointerEvents: "none" }} />
              <input
                type="text"
                required
                placeholder="Google, Microsoft, Stripe…"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="cork-input"
              />
            </div>
          </div>

          {/* Role + Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <Label>Role / Title *</Label>
              <input
                type="text"
                required
                placeholder="Fullstack Engineer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="cork-input no-icon"
              />
            </div>
            <div>
              <Label>Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="cork-input no-icon"
                style={{ appearance: "none", cursor: "pointer" }}
              >
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Interview Date */}
          <div>
            <Label extra={
              interviewDate && (
                <button type="button" onClick={() => setInterviewDate("")} className="btn-string" style={{ fontSize: "0.7rem" }}>Clear</button>
              )
            }>
              Interview Date / Time (Optional)
            </Label>
            <input
              type="datetime-local"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="cork-input no-icon"
            />
          </div>

          {/* Resume Upload */}
          <div>
            <Label extra={<span style={{ fontFamily: "var(--font-hand)", fontSize: "0.72rem", color: "var(--grey)" }}>optional · PDF or DOCX</span>}>
              <FileText size={12} style={{ display: "inline", marginRight: 4 }} />Resume
            </Label>

            {/* Show existing linked resume */}
            {existingResume && !resumeFile && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", background: "rgba(74,124,89,0.07)", border: "1px solid rgba(74,124,89,0.25)", borderRadius: 2, marginBottom: "0.4rem" }}>
                <FileText size={14} style={{ color: "var(--stamp-green)", flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "var(--ink)", flex: 1 }}>{existingResume.label}</span>
                <button
                  type="button"
                  onClick={() => setExistingResume(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--grey)", fontSize: "0.75rem", fontFamily: "var(--font-ui)" }}
                >
                  Remove
                </button>
              </div>
            )}

            {/* File picker area */}
            <div
              style={{ border: "2px dashed rgba(31,28,23,0.2)", borderRadius: 3, padding: "0.875rem", textAlign: "center", cursor: "pointer", background: resumeFile ? "rgba(74,124,89,0.06)" : "transparent", transition: "background 0.15s" }}
              onClick={() => fileInputRef.current?.click()}
            >
              {resumeFile ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <FileText size={16} style={{ color: "var(--stamp-green)" }} />
                  <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "var(--ink)", fontWeight: 600 }}>{resumeFile.name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setResumeFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--grey)", marginLeft: "0.25rem" }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <Upload size={14} style={{ color: "var(--grey)" }} />
                  <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "var(--grey)" }}>
                    {existingResume ? "Replace with a new file…" : "Click to attach a resume…"}
                  </span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                style={{ display: "none" }}
                onChange={(e) => { setResumeFile(e.target.files[0] || null); setFormError(""); }}
              />
            </div>
          </div>

          {/* Job Description */}
          <div>
            <Label extra={<span style={{ fontFamily: "var(--font-hand)", fontSize: "0.72rem", color: "var(--grey)" }}>needed for AI scoring</span>}>
              Job Description (Optional)
            </Label>
            <textarea
              rows={3}
              placeholder="Paste job description requirements here…"
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="cork-input no-icon"
              style={{ resize: "none" }}
            />
          </div>

          {/* Tags */}
          <div>
            <Label>Tags &amp; Labels</Label>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <input
                type="text"
                placeholder="Type tag & press Enter…"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(tagInput); }}}
                className="cork-input no-icon"
                style={{ flex: 1, padding: "0.4rem 0.75rem", fontSize: "0.8rem" }}
              />
              <button type="button" onClick={() => handleAddTag(tagInput)} className="btn-cork-outline" style={{ fontSize: "0.75rem", padding: "0.4rem 0.75rem", flexShrink: 0 }}>
                Add
              </button>
            </div>

            {/* Suggested tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.5rem" }}>
              {SUGGESTED_TAGS.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleAddTag(st)}
                  style={{ fontFamily: "var(--font-ui)", fontSize: "0.68rem", padding: "2px 8px", background: "var(--tape)", border: "1px solid rgba(31,28,23,0.15)", borderRadius: 1, color: "var(--ink)", cursor: "pointer" }}
                >
                  + {st}
                </button>
              ))}
            </div>

            {/* Applied tags */}
            {tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {tags.map((t) => (
                  <span
                    key={t}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontFamily: "var(--font-ui)", fontSize: "0.72rem", padding: "2px 8px", background: "var(--wall-2)", border: "1px solid rgba(31,28,23,0.18)", borderRadius: 1, color: "var(--ink)" }}
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((x) => x !== t))}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--grey)", fontSize: "1rem", lineHeight: 1, padding: 0 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Personal Notes */}
          <div>
            <Label>Personal Notes</Label>
            <input
              type="text"
              placeholder="Referral contact, recruiter name, target salary…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="cork-input no-icon"
            />
          </div>

          {/* Interview Stages Timeline (edit only) */}
          {initialData?.id && (
            <InterviewStagesTimeline
              applicationId={initialData.id}
              initialStages={initialData.stages || []}
            />
          )}

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", paddingTop: "0.25rem", borderTop: "1px dashed rgba(31,28,23,0.12)" }}>
            <button type="button" onClick={onClose} className="btn-cork-outline">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-cork" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              {submitting && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
              {uploadingResume ? "Uploading Resume…" : submitting ? "Saving…" : initialData ? "Update Application" : "Save Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
