// src/components/AiScoreModal.jsx
//
// Modal that scores a resume against a Job Description using Gemini AI.
// If the application has a linked resume, it is used automatically.
// No more manual paste needed!

import React, { useState } from "react";
import { X, Sparkles, CheckCircle2, AlertCircle, Award, FileText } from "lucide-react";
import api from "../lib/api";

export const AiScoreModal = ({ isOpen, onClose, application }) => {
  const [loading, setLoading] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [error, setError] = useState("");

  if (!isOpen || !application) return null;

  const linkedResume = application.resume; // { id, label } or null

  const handleScore = async (e) => {
    e.preventDefault();

    // Guard: if no resume is linked, show a friendly error — don't even call the API
    if (!linkedResume) {
      setError("Please edit this application and attach a resume first.");
      return;
    }

    setError("");
    setLoading(true);
    setScoreResult(null);

    try {
      // The backend will automatically use the linked resume's extractedText.
      // We don't need to send resumeText from the frontend anymore!
      const res = await api.post(`/applications/${application.id}/score`, {});
      const raw = res.data.aiScore || res.data;
      const numericScore = raw.overallScore ?? raw.score ?? 75;
      setScoreResult({
        overallScore: numericScore,
        verdict:
          raw.verdict ||
          (numericScore >= 80
            ? "Excellent Match"
            : numericScore >= 60
            ? "Good Match"
            : "Needs Improvement"),
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

            {/* Resume Status */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Linked Resume</p>
              {linkedResume ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">{linkedResume.label}</span>
                  <CheckCircle2 className="w-4 h-4 ml-auto" />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">
                    No resume attached. Edit this application and attach a resume first.
                  </span>
                </div>
              )}
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
                disabled={loading || !linkedResume}
                className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                Score Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
