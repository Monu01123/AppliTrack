// src/components/ApplicationModal.jsx
//
// Full-featured modal to Add or Edit a Job Application.

import React, { useState, useEffect } from "react";
import { X, Briefcase, Building2, FileText } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "APPLIED", label: "Applied" },
  { value: "PHONE_SCREEN", label: "Phone Screen" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "OFFER", label: "Offer" },
  { value: "REJECTED", label: "Rejected" },
  { value: "GHOSTED", label: "Ghosted" },
];

export const ApplicationModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("APPLIED");
  const [jdText, setJdText] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const SUGGESTED_TAGS = ["Referral", "Cold Apply", "Dream Company", "Startup", "Remote"];

  const formatDateTimeLocal = (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
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
    } else {
      setCompany("");
      setRole("");
      setStatus("APPLIED");
      setJdText("");
      setNotes("");
      setTags([]);
      setInterviewDate("");
    }
    setTagInput("");
  }, [initialData, isOpen]);

  const handleAddTag = (t) => {
    const clean = t.trim();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput("");
  };

  const handleKeyDownTag = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const [formError, setFormError] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      await onSave({
        company,
        role,
        status,
        jdText,
        notes,
        tags,
        interviewDate: interviewDate || null,
      });
      onClose();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to save application. Please check inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
    >
      <div className="glass-card w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-sky-400" />
          {initialData ? "Edit Job Application" : "Track New Application"}
        </h2>

        {formError && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Company Name *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="text"
                required
                placeholder="Google, Microsoft, Stripe..."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="glass-input pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Role / Title *
              </label>
              <input
                type="text"
                required
                placeholder="Fullstack Engineer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="glass-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="glass-input bg-slate-900"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scheduled Interview Date & Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center justify-between">
              <span>Scheduled Interview Date / Time (Optional)</span>
              {interviewDate && (
                <button
                  type="button"
                  onClick={() => setInterviewDate("")}
                  className="text-[10px] text-rose-400 hover:text-rose-300"
                >
                  Clear Date
                </button>
              )}
            </label>
            <input
              type="datetime-local"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="glass-input text-sm bg-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center justify-between">
              <span>Job Description Text (Optional)</span>
              <span className="text-[10px] text-sky-400">Required for AI Resume Scoring</span>
            </label>
            <textarea
              rows={3}
              placeholder="Paste job description requirements here..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="glass-input resize-none text-sm"
            />
          </div>

          {/* Tags & Custom Labels Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Tags & Custom Labels
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Type tag & press Enter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDownTag}
                className="glass-input text-xs py-1.5 flex-1"
              />
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="px-3 py-1.5 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-300 hover:bg-sky-500/30 text-xs font-medium"
              >
                Add Tag
              </button>
            </div>

            {/* Suggested Tags Quick-Add */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SUGGESTED_TAGS.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleAddTag(st)}
                  className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] text-slate-300 hover:border-sky-500/50 hover:text-white"
                >
                  + {st}
                </button>
              ))}
            </div>

            {/* Current Chips */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-medium"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((item) => item !== t))}
                      className="text-sky-400 hover:text-white ml-0.5"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Personal Notes
            </label>
            <input
              type="text"
              placeholder="Referral contact, recruiter name, target salary..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="glass-input text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-sm px-6 py-2.5"
            >
              {submitting ? "Saving..." : initialData ? "Update Application" : "Save Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
