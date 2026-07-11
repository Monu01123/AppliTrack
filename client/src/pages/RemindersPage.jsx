// src/pages/RemindersPage.jsx
//
// Scheduled Follow-up Reminders — pinned index card stack.
// All state, fetch, delete logic are 100% unchanged.

import React, { useState, useEffect } from "react";
import api from "../lib/api";
import { Bell, Trash2, Calendar, CheckCircle2, Building2 } from "lucide-react";

const ROTS = ["cork-card-r1","cork-card-r2","cork-card-r3","cork-card-r5","cork-card-r6","cork-card-r4"];

export const RemindersPage = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading]     = useState(true);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res  = await api.get("/reminders");
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setReminders(list);
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReminders(); }, []);

  const handleDeleteReminder = async (id) => {
    try {
      await api.delete(`/reminders/${id}`);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to cancel reminder:", err);
    }
  };

  return (
    <div style={{ padding: "2rem 1.5rem", maxWidth: 760, margin: "0 auto" }}>

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="tape-label" style={{ marginBottom: "0.5rem" }}>follow-ups</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
          Scheduled Reminders
        </h1>
        <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "var(--grey)", marginTop: "0.2rem" }}>
          Stay on top of your recruiter follow-ups. Automated emails are sent on scheduled dates.
        </p>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "5rem 0" }}>
          <div className="cork-spinner" />
        </div>

      ) : reminders.length === 0 ? (
        <div className="cork-card-flat" style={{ maxWidth: 400, margin: "0 auto", textAlign: "center" }}>
          <Bell size={32} style={{ color: "var(--grey)", margin: "0 auto 1rem", display: "block" }} />
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "var(--ink)", margin: "0 0 0.4rem" }}>
            No reminders pinned
          </h3>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "var(--grey)", margin: 0 }}>
            Click "Remind" on any application card to schedule an automated email alert.
          </p>
          <p style={{ fontFamily: "var(--font-hand)", fontSize: "0.85rem", color: "var(--grey)", marginTop: "0.75rem", opacity: 0.65 }}>
            nothing here yet — go get some interviews!
          </p>
        </div>

      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {reminders.map((rem, i) => {
            const sendDate = new Date(rem.sendAt);
            const rot      = ROTS[i % ROTS.length];

            return (
              <div key={rem.id} className={`cork-card ${rot}`}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                  {/* Left: company + role + date */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <div style={{
                      width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                      border: "1.5px solid rgba(31,28,23,0.14)", borderRadius: 2, flexShrink: 0,
                      background: "var(--wall-2)",
                    }}>
                      <Building2 size={18} style={{ color: "var(--grey)" }} />
                    </div>
                    <div>
                      <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--ink)", margin: "0 0 0.15rem" }}>
                        {rem.application?.company || "Unknown Company"}
                      </h4>
                      <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "var(--grey)", margin: "0 0 0.35rem" }}>
                        {rem.application?.role || "Job Application"}
                        {" · "}
                        <span style={{ fontFamily: "var(--font-stamp)", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink)" }}>
                          {rem.application?.status?.replace("_", " ")}
                        </span>
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <Calendar size={12} style={{ color: "var(--grey)" }} />
                        <span style={{ fontFamily: "var(--font-hand)", fontSize: "0.8rem", color: "var(--grey)" }}>
                          {sendDate.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: status stamp + delete */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                    {rem.sent ? (
                      <span className="stamp stamp-sent" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <CheckCircle2 size={10} /> Sent
                      </span>
                    ) : (
                      <span className="stamp stamp-pending">Pending</span>
                    )}

                    <button
                      onClick={() => handleDeleteReminder(rem.id)}
                      className="btn-icon btn-icon-danger"
                      title="Cancel Reminder"
                      style={{ padding: "0.4rem" }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
