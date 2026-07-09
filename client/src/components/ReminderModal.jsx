// src/components/ReminderModal.jsx
//
// Modal to schedule an automated email reminder for a job application follow-up.

import React, { useState } from "react";
import { X, Bell, Calendar } from "lucide-react";
import api from "../lib/api";

export const ReminderModal = ({ isOpen, onClose, application }) => {
  const [daysFromNow, setDaysFromNow] = useState(5);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-card w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Schedule Follow-up</h2>
            <p className="text-xs text-slate-400">
              For {application.role} at {application.company}
            </p>
          </div>
        </div>

        {success ? (
          <div className="p-6 text-center text-emerald-400 font-medium">
            ✅ Follow-up reminder scheduled successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Remind Me In (Days)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="number"
                  min={1}
                  max={60}
                  required
                  value={daysFromNow}
                  onChange={(e) => setDaysFromNow(e.target.value)}
                  className="glass-input pl-10"
                />
              </div>
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
                className="btn-primary text-sm px-6"
              >
                {loading ? "Scheduling..." : "Set Reminder"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
