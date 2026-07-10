// src/pages/ApplicationsPage.jsx
//
// Full Applications pipeline page with Kanban Board & Table View,
// search, tag filtering, AI scoring, reminders, and CRUD.

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
  Download,
  Calculator,
  Filter,
} from "lucide-react";
import api from "../lib/api";
import { ApplicationModal } from "../components/ApplicationModal";
import { AiScoreModal } from "../components/AiScoreModal";
import { ReminderModal } from "../components/ReminderModal";
import { OfferCalculatorModal } from "../components/OfferCalculatorModal";

const COLUMNS = [
  { id: "APPLIED",      label: "Applied",      color: "border-sky-500/40 bg-sky-500/10 text-sky-300" },
  { id: "PHONE_SCREEN", label: "Phone Screen", color: "border-purple-500/40 bg-purple-500/10 text-purple-300" },
  { id: "INTERVIEW",    label: "Interview",    color: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
  { id: "OFFER",        label: "Offer",        color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
  { id: "REJECTED",     label: "Rejected",     color: "border-rose-500/40 bg-rose-500/10 text-rose-300" },
  { id: "GHOSTED",      label: "Ghosted",      color: "border-slate-500/40 bg-slate-500/10 text-slate-400" },
];

export const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [view, setView] = useState("kanban");

  // Modal States
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [aiApp, setAiApp] = useState(null);
  const [reminderApp, setReminderApp] = useState(null);
  const [calcOpen, setCalcOpen] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/applications");
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setApplications(list);
    } catch (err) {
      console.error("Error loading applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleSaveApplication = async (formData) => {
    if (editingApp) {
      const res = await api.patch(`/applications/${editingApp.id}`, formData);
      setApplications((prev) =>
        prev.map((item) => (item.id === editingApp.id ? res.data : item))
      );
    } else {
      const res = await api.post("/applications", formData);
      setApplications((prev) => [res.data, ...prev]);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this application?")) return;
    try {
      await api.delete(`/applications/${id}`);
      setApplications((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleExport = async (format) => {
    try {
      const res = await api.get(`/applications/export?format=${format}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `hireiq-applications.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

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

    if (isToday) return { text: "Interview TODAY 🎯", style: "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 animate-pulse font-bold" };
    if (diffMs < 0) return { text: "Interview passed", style: "bg-slate-800 border-slate-700 text-slate-400" };
    if (diffHours < 24) {
      const hrs = Math.max(1, Math.round(diffHours));
      return { text: `Interview in ~${hrs}h`, style: "bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold" };
    }
    return { text: `Interview in ${diffDays}d`, style: "bg-sky-500/20 border-sky-500/50 text-sky-300 font-semibold" };
  };

  const allTags = Array.from(
    new Set(applications.flatMap((app) => app.tags || []))
  );

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.company?.toLowerCase().includes(search.toLowerCase()) ||
      app.role?.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !selectedTag || (app.tags && app.tags.includes(selectedTag));
    const matchesStatus = !statusFilter || app.status === statusFilter;
    return matchesSearch && matchesTag && matchesStatus;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-[#2D2B2A]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2D2B2A] tracking-tight">
            Applications
          </h1>
          <p className="text-sm text-[#6E6B6B] mt-0.5">
            {applications.length} total · {filteredApps.length} shown
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Export Group */}
          <div className="flex bg-[#F3F1EC] border border-[#E5E1D8] rounded-xl overflow-hidden text-xs shadow-inner">
            <button
              onClick={() => handleExport("csv")}
              className="px-3 py-2.5 hover:bg-[#EAE6DF] text-[#6E6B6B] flex items-center gap-1 transition-colors border-r border-[#E5E1D8] font-semibold"
              title="Export as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              onClick={() => handleExport("json")}
              className="px-3 py-2.5 hover:bg-[#EAE6DF] text-[#6E6B6B] flex items-center gap-1 transition-colors font-semibold"
              title="Export as JSON"
            >
              JSON
            </button>
          </div>

          <button
            onClick={() => setCalcOpen(true)}
            className="btn-secondary text-xs flex items-center gap-1.5 py-2.5"
          >
            <Calculator className="w-4 h-4 text-[#9C8170]" />
            <span className="hidden sm:inline">Compare Offers</span>
          </button>

          <button
            onClick={() => {
              setEditingApp(null);
              setAppModalOpen(true);
            }}
            className="btn-primary flex items-center gap-2 text-xs py-2.5"
          >
            <Plus className="w-4 h-4" />
            Add Application
          </button>
        </div>
      </div>

      {/* Search, Filter & View Toggle Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#6E6B6B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input py-2.5"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="w-3.5 h-3.5 text-[#6E6B6B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input pr-8 py-2.5 text-xs appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="">All Statuses</option>
            {COLUMNS.map((col) => (
              <option key={col.id} value={col.id}>{col.label}</option>
            ))}
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex bg-[#F3F1EC] border border-[#E5E1D8] p-1 rounded-xl shadow-inner shrink-0">
          <button
            onClick={() => setView("kanban")}
            title="Kanban Board"
            className={`p-2 rounded-lg text-sm transition-all ${
              view === "kanban"
                ? "bg-[#FAF9F6] text-[#2D2B2A] shadow-sm"
                : "text-[#6E6B6B] hover:text-[#2D2B2A]"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("table")}
            title="Table View"
            className={`p-2 rounded-lg text-sm transition-all ${
              view === "table"
                ? "bg-[#FAF9F6] text-[#2D2B2A] shadow-sm"
                : "text-[#6E6B6B] hover:text-[#2D2B2A]"
            }`}
          >
            <TableIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tag Filter Chips */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-wrap">
          <span className="text-xs font-semibold text-[#6E6B6B] uppercase shrink-0">
            Tags:
          </span>
          <button
            onClick={() => setSelectedTag("")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              !selectedTag
                ? "bg-[#2D2B2A] text-[#FAF9F6] shadow"
                : "bg-[#FAF9F6] border border-[#EBE8E1] text-[#6E6B6B] hover:text-[#2D2B2A]"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedTag === tag
                  ? "bg-[#2D2B2A] text-[#FAF9F6] shadow"
                  : "bg-[#FAF9F6] border border-[#EBE8E1] text-[#6E6B6B] hover:text-[#2D2B2A]"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-[#9C8170] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : applications.length === 0 ? (
        <div className="tactile-card p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl carved-box flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-[#9C8170]" />
          </div>
          <h3 className="text-xl font-bold text-[#2D2B2A]">No applications yet</h3>
          <p className="text-[#6E6B6B] text-sm mt-1 mb-6">
            Start tracking your job search! Add your first application.
          </p>
          <button
            onClick={() => {
              setEditingApp(null);
              setAppModalOpen(true);
            }}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add First Application
          </button>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="tactile-card p-10 text-center">
          <p className="text-[#6E6B6B] font-medium">No applications match your filters.</p>
          <button
            onClick={() => { setSearch(""); setSelectedTag(""); setStatusFilter(""); }}
            className="mt-3 text-xs text-[#9C8170] hover:underline font-semibold"
          >
            Clear filters
          </button>
        </div>
      ) : view === "kanban" ? (
        /* ─── KANBAN BOARD ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
          {COLUMNS.filter((col) =>
            statusFilter ? col.id === statusFilter : true
          ).map((col) => {
            const colApps = filteredApps.filter((app) => app.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-[#F3F1EC] border border-[#E5E1D8] rounded-2xl p-3 space-y-3 min-h-[400px]"
              >
                <div className="flex items-center justify-between px-1">
                  <span className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${col.color}`}>
                    {col.label}
                  </span>
                  <span className="text-xs font-mono text-[#6E6B6B] bg-[#FAF9F6] border border-[#EBE8E1] px-2 py-0.5 rounded-full">
                    {colApps.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colApps.map((app) => (
                    <div
                      key={app.id}
                      className="tactile-card p-4 hover:border-[#9C8170] transition-all space-y-3 group"
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
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-[#2D2B2A] text-sm truncate">{app.company}</h4>
                          <p className="text-xs text-[#6E6B6B] mt-0.5 truncate">{app.role}</p>
                          {app.appliedAt && (
                            <p className="text-[10px] text-[#B5A397] mt-1">
                              {new Date(app.appliedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                          <button
                            onClick={() => { setEditingApp(app); setAppModalOpen(true); }}
                            className="p-1.5 text-[#6E6B6B] hover:text-[#2D2B2A] rounded-lg hover:bg-[#EAE6DF]"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(app.id)}
                            className="p-1.5 text-[#6E6B6B] hover:text-[#BA6856] rounded-lg hover:bg-[#EAE6DF]"
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
                              onClick={(e) => { e.stopPropagation(); setSelectedTag(selectedTag === t ? "" : t); }}
                              className="px-2 py-0.5 rounded-full bg-[#EAE6DF] border border-[#DCD8CF] text-[10px] text-[#6E6B6B] hover:text-[#2D2B2A]"
                            >
                              #{t}
                            </button>
                          ))}
                        </div>
                      )}

                      {app.notes && (
                        <p className="text-xs text-[#6E6B6B] bg-[#F3F1EC] p-2 rounded-lg border border-[#E5E1D8] line-clamp-2">
                          {app.notes}
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#EBE8E1]">
                        <button
                          onClick={() => setAiApp(app)}
                          className="flex items-center gap-1 text-[11px] font-medium text-[#9C8170] hover:text-[#7A6358] bg-[#F3F1EC] px-2.5 py-1 rounded-lg border border-[#E5E1D8]"
                        >
                          <Sparkles className="w-3 h-3" />
                          AI Score
                        </button>
                        <button
                          onClick={() => setReminderApp(app)}
                          className="flex items-center gap-1 text-[11px] font-medium text-[#BA6856] hover:text-[#9A5240] bg-[#FAF9F6] px-2.5 py-1 rounded-lg border border-[#EBE8E1]"
                        >
                          <Bell className="w-3 h-3" />
                          Remind
                        </button>
                      </div>
                    </div>
                  ))}

                  {colApps.length === 0 && (
                    <div className="text-center py-8 text-xs text-[#B5A397] italic">
                      No applications here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── TABLE VIEW ─── */
        <div className="tactile-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EBE8E1] bg-[#F3F1EC] text-xs uppercase font-semibold text-[#6E6B6B]">
                  <th className="p-4">Company</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Applied</th>
                  <th className="p-4">Tags</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE8E1] text-sm">
                {filteredApps.map((app) => {
                  const col = COLUMNS.find((c) => c.id === app.status) || COLUMNS[0];
                  return (
                    <tr key={app.id} className="hover:bg-[#F3F1EC]/60 transition-colors group">
                      <td className="p-4">
                        <div className="font-bold text-[#2D2B2A]">{app.company}</div>
                        {app.interviewDate && (() => {
                          const badge = getInterviewCountdownBadge(app.interviewDate);
                          if (!badge) return null;
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] mt-1 ${badge.style}`}>
                              📅 {badge.text}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="p-4 text-[#6E6B6B]">{app.role}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${col.color}`}>
                          {col.label}
                        </span>
                      </td>
                      <td className="p-4 text-[#6E6B6B] text-xs">
                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {(app.tags || []).map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded-full bg-[#EAE6DF] border border-[#DCD8CF] text-[10px] text-[#6E6B6B]">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setAiApp(app)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-[#FAF9F6] text-[#9C8170] border border-[#EBE8E1] hover:bg-[#F3F1EC] font-medium"
                          >
                            ✨ AI Score
                          </button>
                          <button
                            onClick={() => setReminderApp(app)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-[#FAF9F6] text-[#BA6856] border border-[#EBE8E1] hover:bg-[#F3F1EC] font-medium"
                          >
                            ⏰ Remind
                          </button>
                          <button
                            onClick={() => { setEditingApp(app); setAppModalOpen(true); }}
                            className="p-1.5 text-[#6E6B6B] hover:text-[#2D2B2A] rounded-lg hover:bg-[#F3F1EC]"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(app.id)}
                            className="p-1.5 text-[#6E6B6B] hover:text-[#BA6856] rounded-lg hover:bg-[#F3F1EC]"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
      <OfferCalculatorModal
        isOpen={calcOpen}
        onClose={() => setCalcOpen(false)}
      />
    </div>
  );
};
