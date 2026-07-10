// src/components/ReminderModal.jsx
//
// Modal to schedule an automated email reminder for a job application follow-up.
// Styled with Rough White Elegance plaster theme.

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2B2A]/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#FAF9F6] border border-[#EBE8E1] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] w-full max-w-md p-6 relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#6E6B6B] hover:text-[#BA6856] hover:bg-[#F3F1EC] rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl carved-box flex items-center justify-center">
            <Bell className="w-5 h-5 text-[#BA6856]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#2D2B2A]">Schedule Follow-up</h2>
            <p className="text-xs text-[#6E6B6B]">
              {application.role} at <span className="font-semibold text-[#2D2B2A]">{application.company}</span>
            </p>
          </div>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-sm font-semibold text-[#7A8B78]">Reminder scheduled successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#2D2B2A] uppercase tracking-wider mb-1.5">
                Remind me in (days)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#9C8170] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  min={1}
                  max={60}
                  required
                  value={daysFromNow}
                  onChange={(e) => setDaysFromNow(e.target.value)}
                  className="glass-input"
                />
              </div>
              <p className="text-[11px] text-[#B5A397] mt-1.5">
                An email reminder will be sent to your inbox in {daysFromNow} day{daysFromNow !== 1 ? "s" : ""}.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-sm px-4 py-2.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary text-sm px-6 py-2.5 disabled:opacity-60"
              >
                {loading ? "Scheduling…" : "Set Reminder"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
