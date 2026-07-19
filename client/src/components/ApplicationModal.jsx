// src/components/ApplicationModal.jsx
//
// Add / Edit Application modal — corkboard design system.
// All fields, validation, and submit logic are 100% unchanged.

import React, { useState, useEffect } from "react";
import { X, Briefcase, Building2, FileText } from "lucide-react";
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
  const [resumeId, setResumeId]       = useState("");
  const [savedResumes, setSavedResumes] = useState([]);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState("");

  const formatDateTimeLocal = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    if (isOpen) {
      api.get("/resumes").then((res) => setSavedResumes(res.data || [])).catch(() => {});
    }
    if (initialData) {
      setCompany(initialData.company || "");
      setRole(initialData.role || "");
      setStatus(initialData.status || "APPLIED");
      setJdText(initialData.jdText || "");
      setNotes(initialData.notes || "");
      setTags(initialData.tags || []);
      setInterviewDate(formatDateTimeLocal(initialData.interviewDate));
      setResumeId(initialData.resume?.id || "");
    } else {
      setCompany(""); setRole(""); setStatus("APPLIED");
      setJdText(""); setNotes(""); setTags([]); setInterviewDate(""); setResumeId("");
    }
    setTagInput(""); setFormError("");
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
      await onSave({ company, role, status, jdText, notes, tags, interviewDate: interviewDate || null, resumeId: resumeId || null });
      onClose();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to save. Please check your inputs.");
    } finally {
      setSubmitting(false);
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
            <Label>Tags & Labels</Label>
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

          {/* Resume Link (Optional) */}
          <div>
            <Label extra={<span style={{ fontFamily: "var(--font-hand)", fontSize: "0.72rem", color: "var(--grey)" }}>optional</span>}>
              <FileText size={12} style={{ display: "inline", marginRight: 4 }} />Attach Resume
            </Label>
            <select
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
              className="cork-input no-icon"
              style={{ appearance: "none", cursor: "pointer" }}
            >
              <option value="">-- No resume attached --</option>
              {savedResumes.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
            {savedResumes.length === 0 && (
              <p style={{ fontFamily: "var(--font-hand)", fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.3rem" }}>
                Upload resumes in the Resumes section first.
              </p>
            )}
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
            <button type="submit" disabled={submitting} className="btn-cork">
              {submitting ? "Saving…" : initialData ? "Update Application" : "Save Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
