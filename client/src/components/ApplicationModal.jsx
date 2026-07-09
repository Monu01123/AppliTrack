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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCompany(initialData.company || "");
      setRole(initialData.role || "");
      setStatus(initialData.status || "APPLIED");
      setJdText(initialData.jdText || "");
      setNotes(initialData.notes || "");
    } else {
      setCompany("");
      setRole("");
      setStatus("APPLIED");
      setJdText("");
      setNotes("");
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave({ company, role, status, jdText, notes });
      onClose();
    } catch (err) {
      console.error("Failed to save application:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
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
