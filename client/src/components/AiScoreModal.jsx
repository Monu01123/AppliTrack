// src/components/AiScoreModal.jsx
//
// Modal that sends Resume Text + Job Description to Gemini AI for instant scoring.

import React, { useState } from "react";
import { X, Sparkles, CheckCircle2, AlertCircle, Award } from "lucide-react";
import api from "../lib/api";

export const AiScoreModal = ({ isOpen, onClose, application }) => {
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [error, setError] = useState("");

  // Resume Version Manager State
  const [savedResumes, setSavedResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [savingResume, setSavingResume] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      api
        .get("/resumes")
        .then((res) => setSavedResumes(res.data || []))
        .catch((err) => console.error("Error loading resumes:", err));
    }
  }, [isOpen]);

  const handleSelectResume = (id) => {
    setSelectedResumeId(id);
    if (!id) return;
    const found = savedResumes.find((r) => r.id === id);
    if (found) {
      setResumeText(found.content);
    }
  };

  const handleSaveResume = async () => {
    if (!newLabel.trim() || !resumeText.trim()) {
      setError("Please enter a label and resume text to save.");
      return;
    }
    setSavingResume(true);
    setError("");
    try {
      const res = await api.post("/resumes", {
        label: newLabel.trim(),
        content: resumeText,
      });
      setSavedResumes((prev) => [res.data, ...prev]);
      setSelectedResumeId(res.data.id);
      setNewLabel("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save resume version.");
    } finally {
      setSavingResume(false);
    }
  };

  if (!isOpen || !application) return null;

  const handleScore = async (e) => {
    e.preventDefault();
    if (!resumeText.trim()) {
      setError("Please paste your resume text to analyze.");
      return;
    }
    setError("");
    setLoading(true);
    setScoreResult(null);

    try {
      const res = await api.post(`/applications/${application.id}/score`, {
        resumeText,
      });
      const raw = res.data.aiScore || res.data;
      const numericScore = raw.overallScore ?? raw.score ?? 75;
      setScoreResult({
        overallScore: numericScore,
        verdict: raw.verdict || (numericScore >= 80 ? "Excellent Match" : numericScore >= 60 ? "Good Match" : "Needs Improvement"),
        strengths: raw.strengths || raw.matched || [],
        missingSkills: raw.missingSkills || raw.missing || [],
      });
    } catch (err) {
      setError(err.response?.data?.error || "AI scoring failed. Ensure your Gemini API Key is valid.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-card w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Resume Matcher</h2>
            <p className="text-xs text-slate-400">
              Scoring against {application.role} at {application.company}
            </p>
          </div>
        </div>

        {!scoreResult ? (
          <form onSubmit={handleScore} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
                {error}
              </div>
            )}

            {/* Saved Resumes Dropdown */}
            {savedResumes.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Select Saved Resume ({savedResumes.length}/5)
                </label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => handleSelectResume(e.target.value)}
                  className="glass-input bg-slate-900 text-sm"
                >
                  <option value="">-- Or paste fresh text below --</option>
                  {savedResumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label} (Saved {new Date(r.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Resume Text *
              </label>
              <textarea
                rows={6}
                required
                placeholder="Paste your plain resume text here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="glass-input text-sm resize-none font-mono"
              />
            </div>

            {/* Save Resume Bar */}
            <div className="flex items-center gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <input
                type="text"
                placeholder="Save label (e.g. Fullstack v1)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="glass-input text-xs py-1.5 flex-1"
              />
              <button
                type="button"
                onClick={handleSaveResume}
                disabled={savingResume || savedResumes.length >= 5}
                className="px-3 py-1.5 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-300 hover:bg-sky-500/30 text-xs font-medium disabled:opacity-50"
              >
                {savingResume ? "Saving..." : "Save Resume"}
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? "Analyzing with Gemini..." : "Calculate AI Match Score"}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Score Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-900/40 to-indigo-900/40 border border-sky-500/30 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-semibold text-sky-400">Match Rating</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {scoreResult.verdict}
                </h3>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800">
                <Award className="w-6 h-6 text-amber-400" />
                <span className="text-3xl font-extrabold text-white">
                  {scoreResult.overallScore}
                </span>
                <span className="text-slate-400 text-sm">/100</span>
              </div>
            </div>

            {/* Strengths */}
            {scoreResult.strengths?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4" /> Top Strengths
                </h4>
                <ul className="space-y-1 pl-6 list-disc text-sm text-slate-300">
                  {scoreResult.strengths.map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Skills */}
            {scoreResult.missingSkills?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4" /> Recommended Keywords / Missing Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {scoreResult.missingSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setScoreResult(null)}
                className="btn-primary text-sm px-6"
              >
                Test Another Resume
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
