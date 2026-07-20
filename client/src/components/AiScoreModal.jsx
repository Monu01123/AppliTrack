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
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(31,28,23,0.45)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{ background: "var(--card)", borderRadius: 3, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", position: "relative", padding: "1.75rem" }}
      >
        <button
          onClick={onClose}
          className="btn-icon"
          style={{ position: "absolute", top: "1rem", right: "1rem" }}
        >
          <X size={18} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
          <Sparkles size={20} style={{ color: "var(--stamp-blue)" }} />
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
              AI Resume Matcher
            </h2>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem", color: "var(--grey)", margin: "0.2rem 0 0 0" }}>
              Scoring against {application.role} at {application.company}
            </p>
          </div>
        </div>

        {!scoreResult ? (
          <form onSubmit={handleScore} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {error && (
              <div style={{ background: "rgba(178,58,47,0.08)", border: "1px solid rgba(178,58,47,0.25)", borderRadius: 2, padding: "0.6rem 0.875rem", fontFamily: "var(--font-ui)", fontSize: "0.85rem", color: "var(--string)" }}>
                {error}
              </div>
            )}

            {/* Resume Status */}
            <div style={{ background: "var(--wall)", padding: "1rem", borderRadius: 2, border: "1px solid var(--border)" }}>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", fontWeight: 600, color: "var(--grey)", textTransform: "uppercase", marginBottom: "0.5rem" }}>Linked Resume</p>
              {linkedResume ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--stamp-green)", fontFamily: "var(--font-ui)", fontSize: "0.9rem", fontWeight: 500 }}>
                  <FileText size={16} />
                  <span>{linkedResume.label}</span>
                  <CheckCircle2 size={16} style={{ marginLeft: "auto" }} />
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--stamp-amber)", fontFamily: "var(--font-ui)", fontSize: "0.9rem" }}>
                  <AlertCircle size={16} />
                  <span>No resume attached. Edit this application and attach a resume first.</span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button type="button" onClick={onClose} className="btn-action">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !linkedResume}
                className="btn-action"
                style={{ background: "var(--stamp-blue)", color: "white", borderColor: "var(--stamp-blue)" }}
              >
                <Sparkles size={14} style={{ marginRight: "0.4rem" }} />
                {loading ? "Analyzing with Gemini..." : "Calculate AI Score"}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", animation: "fadeIn 0.3s ease" }}>
            {/* Score Banner */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(35, 116, 171, 0.08)", padding: "1.25rem", borderRadius: 3, border: "1px dashed var(--stamp-blue)" }}>
              <div>
                <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", fontWeight: 600, color: "var(--stamp-blue)", textTransform: "uppercase", margin: 0 }}>Match Rating</p>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 700, color: "var(--ink)", margin: "0.2rem 0 0 0" }}>
                  {scoreResult.verdict}
                </h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "var(--card)", padding: "0.5rem 1rem", borderRadius: 2, border: "1px solid var(--border)", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
                <Award size={24} style={{ color: "var(--stamp-amber)" }} />
                <span style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800, color: "var(--ink)" }}>
                  {scoreResult.overallScore}
                </span>
                <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem", color: "var(--grey)", alignSelf: "flex-end", paddingBottom: "0.3rem" }}>/100</span>
              </div>
            </div>

            {/* Strengths */}
            {scoreResult.strengths?.length > 0 && (
              <div>
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem", fontWeight: 700, color: "var(--stamp-green)", display: "flex", alignItems: "center", gap: "0.4rem", margin: "0 0 0.5rem 0" }}>
                  <CheckCircle2 size={16} /> Top Strengths
                </h4>
                <ul style={{ margin: 0, paddingLeft: "1.5rem", fontFamily: "var(--font-ui)", fontSize: "0.9rem", color: "var(--ink)", lineHeight: 1.5 }}>
                  {scoreResult.strengths.map((str, idx) => (
                    <li key={idx} style={{ paddingBottom: "0.25rem" }}>{str}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Skills */}
            {scoreResult.missingSkills?.length > 0 && (
              <div>
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem", fontWeight: 700, color: "var(--stamp-amber)", display: "flex", alignItems: "center", gap: "0.4rem", margin: "0 0 0.5rem 0" }}>
                  <AlertCircle size={16} /> Recommended Keywords / Missing
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {scoreResult.missingSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      style={{ padding: "0.25rem 0.6rem", background: "rgba(224, 159, 62, 0.1)", border: "1px solid rgba(224, 159, 62, 0.3)", borderRadius: 100, fontFamily: "var(--font-ui)", fontSize: "0.8rem", fontWeight: 500, color: "var(--stamp-amber)" }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button
                type="button"
                onClick={() => setScoreResult(null)}
                className="btn-action"
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
