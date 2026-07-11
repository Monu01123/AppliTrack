// src/components/ReminderModal.jsx
//
// Schedule a follow-up email reminder — corkboard design system.
// All state, API call, and logic are 100% unchanged.

import React, { useState } from "react";
import { X, Bell, Calendar } from "lucide-react";
import api from "../lib/api";

export const ReminderModal = ({ isOpen, onClose, application }) => {
  const [daysFromNow, setDaysFromNow] = useState(5);
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);

  if (!isOpen || !application) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      await api.post("/reminders", {
        applicationId: application.id,
        daysFromNow: Number(daysFromNow),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Failed to schedule reminder:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(31,28,23,0.45)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--card)", borderRadius: 3, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", width: "100%", maxWidth: 400, position: "relative", padding: "1.75rem" }}>
        {/* Close */}
        <button onClick={onClose} className="btn-icon" style={{ position: "absolute", top: "1rem", right: "1rem" }}>
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
          <Bell size={18} style={{ color: "var(--string)" }} />
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
              Schedule Follow-up
            </h2>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", color: "var(--grey)", margin: "0.15rem 0 0" }}>
              {application.role} at <strong style={{ color: "var(--ink)" }}>{application.company}</strong>
            </p>
          </div>
        </div>

        {success ? (
          <div style={{ padding: "2rem 0", textAlign: "center" }}>
            <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</p>
            <p style={{ fontFamily: "var(--font-hand)", fontSize: "1rem", color: "var(--stamp-green)" }}>
              Reminder scheduled successfully!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontFamily: "var(--font-ui)", fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--grey)", marginBottom: "0.35rem" }}>
                Remind me in (days)
              </label>
              <div style={{ position: "relative" }}>
                <Calendar size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--grey)", pointerEvents: "none" }} />
                <input
                  type="number"
                  min={1}
                  max={60}
                  required
                  value={daysFromNow}
                  onChange={(e) => setDaysFromNow(e.target.value)}
                  className="cork-input"
                />
              </div>
              <p style={{ fontFamily: "var(--font-hand)", fontSize: "0.78rem", color: "var(--grey)", marginTop: "0.4rem" }}>
                an email reminder will be sent in {daysFromNow} day{daysFromNow !== 1 ? "s" : ""}
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", paddingTop: "0.25rem", borderTop: "1px dashed rgba(31,28,23,0.12)" }}>
              <button type="button" onClick={onClose} className="btn-cork-outline">Cancel</button>
              <button type="submit" disabled={loading} className="btn-cork">
                {loading ? "Scheduling…" : "Set Reminder"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
