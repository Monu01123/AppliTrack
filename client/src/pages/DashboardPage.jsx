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
  const [view, setView] = useState("kanban"); // "kanban" | "table"

  // Modal States
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [aiApp, setAiApp] = useState(null);
  const [reminderApp, setReminderApp] = useState(null);

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
  }, []);

  // Save or Update Application
  const handleSaveApplication = async (formData) => {
    if (editingApp) {
      const res = await api.put(`/applications/${editingApp.id}`, formData);
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

  // Filtered Applications
  const filteredApps = (Array.isArray(applications) ? applications : []).filter(
    (app) =>
      app.company?.toLowerCase().includes(search.toLowerCase()) ||
      app.role?.toLowerCase().includes(search.toLowerCase())
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
                      <td className="p-4 font-bold text-white">{app.company}</td>
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
