// src/pages/RemindersPage.jsx
//
// Page listing upcoming scheduled email reminders for job application follow-ups.

import React, { useState, useEffect } from "react";
import api from "../lib/api";
import { Bell, Trash2, Calendar, CheckCircle2, Building2 } from "lucide-react";

export const RemindersPage = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/reminders");
      setReminders(res.data);
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleDeleteReminder = async (id) => {
    try {
      await api.delete(`/reminders/${id}`);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to cancel reminder:", err);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bell className="w-6 h-6 text-amber-400" />
          Scheduled Follow-up Reminders
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Stay on top of your recruiter follow-ups. Automated emails are sent on scheduled dates.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reminders.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-7 h-7 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-white">No reminders scheduled</h3>
          <p className="text-slate-400 text-sm mt-1">
            Click "Remind ⏰" on any job application card on your Dashboard to schedule an automated email alert!
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden divide-y divide-slate-800/60">
          {reminders.map((rem) => {
            const sendDate = new Date(rem.sendAt);
            const isPast = sendDate < new Date();

            return (
              <div
                key={rem.id}
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">
                      {rem.application?.company || "Unknown Company"}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {rem.application?.role || "Job Application"} • Status:{" "}
                      <span className="text-slate-200 font-semibold">
                        {rem.application?.status?.replace("_", " ")}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Scheduled for: {sendDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {rem.sent ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
                      Pending
                    </span>
                  )}

                  <button
                    onClick={() => handleDeleteReminder(rem.id)}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                    title="Cancel Reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
