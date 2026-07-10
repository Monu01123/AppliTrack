// src/components/ApplicationModal.jsx
//
// Full-featured modal to Add or Edit a Job Application.
// Styled with Rough White Elegance plaster theme.

import React, { useState, useEffect } from "react";
import { X, Briefcase, Building2 } from "lucide-react";
import { InterviewStagesTimeline } from "./InterviewStagesTimeline";

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
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("APPLIED");
  const [jdText, setJdText] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

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
    } else {
      setCompany(""); setRole(""); setStatus("APPLIED");
      setJdText(""); setNotes(""); setTags([]); setInterviewDate("");
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
      await onSave({ company, role, status, jdText, notes, tags, interviewDate: interviewDate || null });
      onClose();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to save. Please check your inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2B2A]/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#FAF9F6] border border-[#EBE8E1] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#6E6B6B] hover:text-[#BA6856] hover:bg-[#F3F1EC] rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <h2 className="text-lg font-bold text-[#2D2B2A] mb-5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl carved-box flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-[#9C8170]" />
          </div>
          {initialData ? "Edit Application" : "Track New Application"}
        </h2>

        {/* Error */}
        {formError && (
          <div className="mb-4 p-3 bg-[#FDF2F0] border border-[#E8B8B0] rounded-xl text-[#BA6856] text-xs">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company */}
          <div>
            <label className="block text-xs font-semibold text-[#2D2B2A] uppercase tracking-wider mb-1.5">
              Company Name *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-[#9C8170] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                placeholder="Google, Microsoft, Stripe..."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          {/* Role + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2D2B2A] uppercase tracking-wider mb-1.5">
                Role / Title *
              </label>
              <input
                type="text"
                required
                placeholder="Fullstack Engineer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="glass-input no-icon"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#2D2B2A] uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="glass-input no-icon appearance-none cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Interview Date */}
          <div>
            <label className="block text-xs font-semibold text-[#2D2B2A] uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Interview Date / Time (Optional)</span>
              {interviewDate && (
                <button
                  type="button"
                  onClick={() => setInterviewDate("")}
                  className="text-[10px] text-[#BA6856] hover:underline"
                >
                  Clear
                </button>
              )}
            </label>
            <input
              type="datetime-local"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="glass-input no-icon text-sm"
            />
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-xs font-semibold text-[#2D2B2A] uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Job Description (Optional)</span>
              <span className="text-[10px] text-[#9C8170] normal-case font-normal">Required for AI scoring</span>
            </label>
            <textarea
              rows={3}
              placeholder="Paste job description requirements here..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="glass-input no-icon resize-none text-sm"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-[#2D2B2A] uppercase tracking-wider mb-1.5">
              Tags & Labels
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Type tag & press Enter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(tagInput); }}}
                className="glass-input no-icon text-xs py-1.5 flex-1"
              />
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="btn-secondary text-xs px-3 py-1.5 shrink-0"
              >
                Add
              </button>
            </div>

            {/* Quick-add suggested tags */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SUGGESTED_TAGS.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleAddTag(st)}
                  className="px-2 py-0.5 rounded-full bg-[#EAE6DF] border border-[#DCD8CF] text-[10px] text-[#6E6B6B] hover:text-[#2D2B2A] hover:border-[#9C8170] transition-colors"
                >
                  + {st}
                </button>
              ))}
            </div>

            {/* Applied tag chips */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EAE6DF] border border-[#DCD8CF] text-[#2D2B2A] text-xs font-medium"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((item) => item !== t))}
                      className="text-[#6E6B6B] hover:text-[#BA6856] ml-0.5 leading-none"
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
            <label className="block text-xs font-semibold text-[#2D2B2A] uppercase tracking-wider mb-1.5">
              Personal Notes
            </label>
            <input
              type="text"
              placeholder="Referral contact, recruiter name, target salary..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="glass-input no-icon text-sm"
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
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-sm px-4 py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-sm px-6 py-2.5 disabled:opacity-60"
            >
              {submitting ? "Saving…" : initialData ? "Update Application" : "Save Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
