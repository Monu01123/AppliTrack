// src/pages/DashboardPage.jsx
//
// Interactive Applications Dashboard supporting Kanban Board & Table Views,
// AI Resume Scoring, Follow-up Reminders, and full CRUD.

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  Bell,
  Edit2,
  Trash2,
  Building2,
  Calendar,
  Share2,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import api from "../lib/api";
import { ApplicationModal } from "../components/ApplicationModal";
import { AiScoreModal } from "../components/AiScoreModal";
import { ReminderModal } from "../components/ReminderModal";

const COLUMNS = [
  { id: "APPLIED", label: "Applied", color: "border-sky-500/40 bg-sky-500/10 text-sky-300" },
  { id: "PHONE_SCREEN", label: "Phone Screen", color: "border-purple-500/40 bg-purple-500/10 text-purple-300" },
  { id: "INTERVIEW", label: "Interview", color: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
  { id: "OFFER", label: "Offer", color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
  { id: "REJECTED", label: "Rejected", color: "border-rose-500/40 bg-rose-500/10 text-rose-300" },
  { id: "GHOSTED", label: "Ghosted", color: "border-slate-700 bg-slate-800 text-slate-400" },
];

export const DashboardPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [view, setView] = useState("kanban"); // "kanban" | "table"

  // Modal States
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [aiApp, setAiApp] = useState(null);
  const [reminderApp, setReminderApp] = useState(null);

  // Public Profile Showcase State
  const [publicProfile, setPublicProfile] = useState(null);
  const [slugInput, setSlugInput] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  const fetchPublicSettings = async () => {
    try {
      const res = await api.get("/auth/profile/public");
      setPublicProfile(res.data);
      setSlugInput(res.data.profileSlug || "");
    } catch (err) {
      console.error("Failed to fetch public profile settings:", err);
    }
  };

  const handleTogglePublic = async () => {
    if (!publicProfile) return;
    setSavingProfile(true);
    setProfileMsg("");
    try {
      const nextVal = !publicProfile.publicProfileEnabled;
      const res = await api.patch("/auth/profile/public", {
        publicProfileEnabled: nextVal,
      });
      setPublicProfile(res.data);
      setProfileMsg(nextVal ? "Public showcase enabled!" : "Public showcase set to private.");
    } catch (err) {
      setProfileMsg("Failed to update public settings.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveSlug = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    try {
      const res = await api.patch("/auth/profile/public", {
        profileSlug: slugInput || null,
      });
      setPublicProfile(res.data);
      setProfileMsg("Profile slug saved!");
    } catch (err) {
      setProfileMsg(err.response?.data?.error || "Failed to save slug.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCopyPublicLink = () => {
    if (!publicProfile) return;
    const identifier = publicProfile.profileSlug || publicProfile.id;
    const url = `${window.location.origin}/p/${identifier}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Load applications from backend
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/applications");
      const appsList = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setApplications(appsList);
    } catch (err) {
      console.error("Error loading applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchPublicSettings();
  }, []);

  // Save or Update Application
  const handleSaveApplication = async (formData) => {
    if (editingApp) {
      const res = await api.patch(`/applications/${editingApp.id}`, formData);
      const updatedApp = res.data;
      setApplications((prev) =>
        prev.map((item) => (item.id === editingApp.id ? updatedApp : item))
      );
    } else {
      const res = await api.post("/applications", formData);
      const newApp = res.data;
      setApplications((prev) => [newApp, ...prev]);
    }
  };

  // Delete Application
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;
    try {
      await api.delete(`/applications/${id}`);
      setApplications((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Failed to delete application:", err);
    }
  };

  // Collect all unique tags across applications
  const allTags = Array.from(
    new Set(
      (Array.isArray(applications) ? applications : []).flatMap(
        (app) => app.tags || []
      )
    )
  );

  // Interview Date Countdown Badge Helper
  const getInterviewCountdownBadge = (dateStr) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    if (isNaN(target)) return null;
    const now = new Date();
    const diffMs = target - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const isToday =
      target.getDate() === now.getDate() &&
      target.getMonth() === now.getMonth() &&
      target.getFullYear() === now.getFullYear();

    if (isToday) {
      return {
        text: "Interview TODAY 🎯",
        style: "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 animate-pulse font-bold",
      };
    }
    if (diffMs < 0) {
      return {
        text: "Interview passed",
        style: "bg-slate-800 border-slate-700 text-slate-400",
      };
    }
    if (diffHours < 24) {
      const hrs = Math.max(1, Math.round(diffHours));
      return {
        text: `Interview in ~${hrs} hr${hrs > 1 ? "s" : ""}`,
        style: "bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold",
      };
    }
    return {
      text: `Interview in ${diffDays} day${diffDays > 1 ? "s" : ""}`,
      style: "bg-sky-500/20 border-sky-500/50 text-sky-300 font-semibold",
    };
  };

  // Filtered Applications
  const filteredApps = (Array.isArray(applications) ? applications : []).filter(
    (app) => {
      const matchesSearch =
        app.company?.toLowerCase().includes(search.toLowerCase()) ||
        app.role?.toLowerCase().includes(search.toLowerCase());
      const matchesTag =
        !selectedTag || (app.tags && app.tags.includes(selectedTag));
      return matchesSearch && matchesTag;
    }
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input pl-10 py-2.5 text-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setView("kanban")}
              title="Kanban Board"
              className={`p-2 rounded-lg text-sm transition-all ${
                view === "kanban"
                  ? "bg-sky-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("table")}
              title="Table View"
              className={`p-2 rounded-lg text-sm transition-all ${
                view === "table"
                  ? "bg-sky-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Add New Application Button */}
          <button
            onClick={() => {
              setEditingApp(null);
              setAppModalOpen(true);
            }}
            className="btn-primary flex items-center gap-2 text-sm py-2.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {/* Shareable Public Showcase Control Banner */}
      {publicProfile && (
        <div className="glass-card p-4 border border-sky-500/30 bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Share2 className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-white text-sm">Shareable Public Showcase</h3>
              <button
                onClick={handleTogglePublic}
                disabled={savingProfile}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all ${
                  publicProfile.publicProfileEnabled
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"
                }`}
              >
                {publicProfile.publicProfileEnabled ? "● Public ON" : "○ Private OFF"}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Share verified aggregate stats and non-confidential application timeline with mentors or recruiters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            <form onSubmit={handleSaveSlug} className="flex items-center gap-1.5">
              <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
                <span className="text-slate-500 text-[11px]">/p/</span>
                <input
                  type="text"
                  placeholder="your-custom-slug"
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  className="bg-transparent border-none outline-none text-white text-xs w-28 focus:w-36 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                Save Slug
              </button>
            </form>

            {publicProfile.publicProfileEnabled && (
              <>
                <button
                  onClick={handleCopyPublicLink}
                  className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
                </button>
                <a
                  href={`/p/${publicProfile.profileSlug || publicProfile.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-sky-500/20"
                >
                  <span>View Public Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </>
            )}

            {profileMsg && (
              <span className="text-[11px] text-sky-400 font-medium block md:inline">{profileMsg}</span>
            )}
          </div>
        </div>
      )}

      {/* Tag Filter Chip Bar */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-slate-400 uppercase shrink-0">
            Filter by Tag:
          </span>
          <button
            onClick={() => setSelectedTag("")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              !selectedTag
                ? "bg-sky-500 text-white shadow"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            All ({applications.length})
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedTag === tag
                  ? "bg-sky-500 text-white shadow"
                  : "bg-slate-900 border border-slate-800 text-slate-300 hover:border-sky-500/50"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : applications.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-sky-400" />
          </div>
          <h3 className="text-xl font-bold text-white">No applications tracked yet</h3>
          <p className="text-slate-400 text-sm mt-1 mb-6">
            Start tracking your job search! Add your first application to organize interviews and get AI score analysis.
          </p>
          <button
            onClick={() => {
              setEditingApp(null);
              setAppModalOpen(true);
            }}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Application</span>
          </button>
        </div>
      ) : view === "kanban" ? (
        /* ─── KANBAN BOARD VIEW ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colApps = filteredApps.filter((app) => app.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-3 space-y-3 min-h-[420px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <span
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${col.color}`}
                  >
                    {col.label}
                  </span>
                  <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full">
                    {colApps.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3">
                  {colApps.map((app) => (
                    <div
                      key={app.id}
                      className="glass-card p-4 hover:border-slate-700 transition-all space-y-3 group"
                    >
                      {app.interviewDate && (() => {
                        const badge = getInterviewCountdownBadge(app.interviewDate);
                        if (!badge) return null;
                        return (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${badge.style}`}>
                            <span>📅</span>
                            <span>{badge.text}</span>
                          </div>
                        );
                      })()}

                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-white text-sm">
                            {app.company}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {app.role}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingApp(app);
                              setAppModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(app.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Tag Chips */}
                      {app.tags && app.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {app.tags.map((t) => (
                            <button
                              key={t}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTag(selectedTag === t ? "" : t);
                              }}
                              className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[10px] text-sky-300 hover:border-sky-500/50"
                            >
                              #{t}
                            </button>
                          ))}
                        </div>
                      )}

                      {app.notes && (
                        <p className="text-xs text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 line-clamp-2">
                          {app.notes}
                        </p>
                      )}

                      {/* Card Action Badges */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                        <button
                          onClick={() => setAiApp(app)}
                          className="flex items-center gap-1 text-[11px] font-medium text-sky-400 hover:text-sky-300 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20"
                        >
                          <Sparkles className="w-3 h-3" />
                          AI Score
                        </button>

                        <button
                          onClick={() => setReminderApp(app)}
                          className="flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20"
                        >
                          <Bell className="w-3 h-3" />
                          Remind
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── TABLE VIEW ─── */
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-xs uppercase font-semibold text-slate-400">
                  <th className="p-4">Company</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Applied Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredApps.map((app) => {
                  const col = COLUMNS.find((c) => c.id === app.status) || COLUMNS[0];
                  return (
                    <tr key={app.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span>{app.company}</span>
                          {app.interviewDate && (() => {
                            const badge = getInterviewCountdownBadge(app.interviewDate);
                            if (!badge) return null;
                            return (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] ${badge.style}`}>
                                📅 {badge.text}
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">{app.role}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${col.color}`}
                        >
                          {col.label}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-xs">
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setAiApp(app)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20"
                        >
                          AI Score ✨
                        </button>
                        <button
                          onClick={() => setReminderApp(app)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
                        >
                          Remind ⏰
                        </button>
                        <button
                          onClick={() => {
                            setEditingApp(app);
                            setAppModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white"
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <ApplicationModal
        isOpen={appModalOpen}
        onClose={() => setAppModalOpen(false)}
        onSave={handleSaveApplication}
        initialData={editingApp}
      />
      <AiScoreModal
        isOpen={!!aiApp}
        onClose={() => setAiApp(null)}
        application={aiApp}
      />
      <ReminderModal
        isOpen={!!reminderApp}
        onClose={() => setReminderApp(null)}
        application={reminderApp}
      />
    </div>
  );
};
