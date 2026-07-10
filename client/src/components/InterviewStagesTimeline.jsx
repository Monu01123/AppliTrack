// src/components/InterviewStagesTimeline.jsx
//
// Interactive multi-round Interview Stage Timeline & Round-by-Round Notes component.
// Allows users to log distinct interview rounds, interviewers, dates, and feedback notes.

import React, { useState } from "react";
import api from "../lib/api";
import { Plus, CheckCircle2, XCircle, Clock, Trash2, UserCheck, Calendar } from "lucide-react";

export const InterviewStagesTimeline = ({ applicationId, initialStages = [], onStagesChange }) => {
  const [stages, setStages] = useState(initialStages);
  const [newStageName, setNewStageName] = useState("");
  const [newInterviewer, setNewInterviewer] = useState("");
  const [newInterviewDate, setNewInterviewDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setErrorMsg("");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setSuccessMsg("");
    setTimeout(() => setErrorMsg(""), 4000);
  };

  const handleAddStage = async (e) => {
    e.preventDefault();
    if (!newStageName.trim()) return;
    try {
      setAdding(true);
      const res = await api.post(`/applications/${applicationId}/stages`, {
        stageName: newStageName.trim(),
        interviewer: newInterviewer.trim() || null,
        interviewDate: newInterviewDate || null,
        roundOrder: stages.length + 1,
      });
      const updatedList = [...stages, res.data];
      setStages(updatedList);
      if (onStagesChange) onStagesChange(updatedList);
      setNewStageName("");
      setNewInterviewer("");
      setNewInterviewDate("");
      showSuccess("Interview round added!");
    } catch (err) {
      showError(err.response?.data?.error || "Failed to add interview round");
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateStatus = async (stageId, passed) => {
    try {
      const res = await api.patch(`/stages/${stageId}`, { passed });
      const updatedList = stages.map((s) => (s.id === stageId ? res.data : s));
      setStages(updatedList);
      if (onStagesChange) onStagesChange(updatedList);
    } catch (err) {
      showError("Failed to update round status");
    }
  };

  const handleUpdateNotes = async (stageId, notes) => {
    try {
      const res = await api.patch(`/stages/${stageId}`, { notes });
      const updatedList = stages.map((s) => (s.id === stageId ? res.data : s));
      setStages(updatedList);
      if (onStagesChange) onStagesChange(updatedList);
      showSuccess("Notes saved");
    } catch (err) {
      showError("Failed to save notes");
    }
  };

  const handleDeleteStage = async (stageId) => {
    try {
      await api.delete(`/stages/${stageId}`);
      const updatedList = stages.filter((s) => s.id !== stageId);
      setStages(updatedList);
      if (onStagesChange) onStagesChange(updatedList);
      showSuccess("Round deleted");
    } catch (err) {
      showError("Failed to delete round");
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-800">
      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
        <span>Interview Stage Timeline & Notes</span>
        <span className="text-[10px] text-sky-400 font-normal">{stages.length} Round(s)</span>
      </h4>

      {errorMsg && (
        <div className="mb-2 p-2 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-2 p-2 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs">
          {successMsg}
        </div>
      )}

      {/* Timeline List */}
      {stages.length === 0 ? (
        <p className="text-xs text-slate-500 italic mb-4">
          No interview rounds logged yet. Add your recruiter screen or technical interview below.
        </p>
      ) : (
        <div className="space-y-3 mb-4">
          {stages.map((stage, idx) => (
            <div
              key={stage.id}
              className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 relative group"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[11px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-white">{stage.stageName}</span>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(stage.id, stage.passed === true ? null : true)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors flex items-center gap-1 ${
                      stage.passed === true
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-slate-800 text-slate-400 hover:text-emerald-400"
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" /> Passed
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(stage.id, stage.passed === false ? null : false)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors flex items-center gap-1 ${
                      stage.passed === false
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : "bg-slate-800 text-slate-400 hover:text-rose-400"
                    }`}
                  >
                    <XCircle className="w-3 h-3" /> Failed
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteStage(stage.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 ml-1"
                    title="Delete Round"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Meta Info (Interviewer & Date) */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mb-2">
                {stage.interviewer && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <UserCheck className="w-3 h-3 text-sky-400" /> {stage.interviewer}
                  </span>
                )}
                {stage.interviewDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-sky-400" />{" "}
                    {new Date(stage.interviewDate).toLocaleDateString()}{" "}
                    {new Date(stage.interviewDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>

              {/* Round-by-Round Notes */}
              <textarea
                rows={2}
                defaultValue={stage.notes || ""}
                onBlur={(e) => handleUpdateNotes(stage.id, e.target.value)}
                placeholder="Round notes (e.g. System design architecture, interviewer feedback, prep topics)..."
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 resize-none"
              />
            </div>
          ))}
        </div>
      )}

      {/* Add New Round Form */}
      <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60">
        <div className="text-[11px] font-semibold text-slate-400 mb-2">+ Add Interview Round</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
          <input
            type="text"
            placeholder="Stage (e.g. Technical Round)"
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            className="glass-input text-xs py-1.5"
          />
          <input
            type="text"
            placeholder="Interviewer Name / Role"
            value={newInterviewer}
            onChange={(e) => setNewInterviewer(e.target.value)}
            className="glass-input text-xs py-1.5"
          />
          <input
            type="datetime-local"
            value={newInterviewDate}
            onChange={(e) => setNewInterviewDate(e.target.value)}
            className="glass-input text-xs py-1.5 bg-slate-900"
          />
        </div>
        <button
          type="button"
          onClick={handleAddStage}
          disabled={adding || !newStageName.trim()}
          className="w-full py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add Interview Round
        </button>
      </div>
    </div>
  );
};
