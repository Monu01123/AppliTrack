// src/pages/ApplicationsPage.jsx
//
// Applications pipeline — corkboard lanes & pinned index cards.
// All state, API calls, filtering, modal logic are 100% unchanged.

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, LayoutGrid, Table as TableIcon,
  Sparkles, Bell, Edit2, Trash2, Building2, Download, Calculator, Filter, Loader2,
} from "lucide-react";
import api from "../lib/api";
import { ApplicationModal }    from "../components/ApplicationModal";
import { AiScoreModal }        from "../components/AiScoreModal";
import { ReminderModal }       from "../components/ReminderModal";
import { OfferCalculatorModal } from "../components/OfferCalculatorModal";

// Column definitions — id, label, stamp class, accent color for the lane header
const COLUMNS = [
  { id: "APPLIED",      label: "Applied",      stampClass: "stamp-applied",   accent: "var(--stamp-blue)"   },
  { id: "PHONE_SCREEN", label: "Phone Screen", stampClass: "stamp-phone",     accent: "var(--stamp-purple)" },
  { id: "INTERVIEW",    label: "Interview",    stampClass: "stamp-interview", accent: "var(--stamp-amber)"  },
  { id: "OFFER",        label: "Offer",        stampClass: "stamp-offer",     accent: "var(--stamp-green)"  },
  { id: "REJECTED",     label: "Rejected",     stampClass: "stamp-rejected",  accent: "var(--stamp-grey)"   },
  { id: "GHOSTED",      label: "Ghosted",      stampClass: "stamp-ghosted",   accent: "var(--stamp-grey)"   },
];

// Rotation class pool for cards
const ROTATIONS = ["cork-card-r1","cork-card-r2","cork-card-r3","cork-card-r4","cork-card-r5","cork-card-r6"];
const rotFor = (i) => ROTATIONS[i % ROTATIONS.length];

const getDaysSinceText = (app) => {
  const dateStr = app.appliedAt || app.createdAt;
  if (!dateStr) return null;
  const diffTime = Math.abs(new Date() - new Date(dateStr));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Added today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
};

export const ApplicationsPage = () => {
  const [search, setSearch]             = useState("");
  const [selectedTag, setSelectedTag]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [view, setView]                 = useState("kanban");

  const [appModalOpen, setAppModalOpen] = useState(false);
  const [editingApp, setEditingApp]     = useState(null);
  const [aiApp, setAiApp]               = useState(null);
  const [reminderApp, setReminderApp]   = useState(null);
  const [calcOpen, setCalcOpen]         = useState(false);
  const [downloadingResumeId, setDownloadingResumeId] = useState(null);

  const handleDownloadResume = async (app, e) => {
    if (e) e.stopPropagation();
    if (!app?.resume?.id) return;
    setDownloadingResumeId(app.resume.id);
    try {
      const res = await api.get(`/resumes/${app.resume.id}/download`);
      window.open(res.data.url, "_blank");
    } catch (err) {
      alert("Failed to download resume. Please try again.");
    } finally {
      setDownloadingResumeId(null);
    }
  };

  // ── Applications (React Query + Optimistic Mutations) ──────────────────
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading: loading } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const res = await api.get("/applications");
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ editingId, formData }) => {
      if (editingId) {
        const res = await api.patch(`/applications/${editingId}`, formData);
        return res.data;
      } else {
        const res = await api.post("/applications", formData);
        return res.data;
      }
    },
    onMutate: async ({ editingId, formData }) => {
      await queryClient.cancelQueries({ queryKey: ['applications'] });
      const previousApps = queryClient.getQueryData(['applications']);
      if (previousApps) {
        if (editingId) {
          queryClient.setQueryData(['applications'], (old = []) =>
            old.map((a) => (a.id === editingId ? { ...a, ...formData } : a))
          );
        } else {
          const tempApp = {
            id: `temp-${Date.now()}`,
            company: formData.company || "New Application",
            role: formData.role || "",
            status: formData.status || "APPLIED",
            tags: formData.tags || [],
            appliedAt: new Date().toISOString(),
            ...formData,
          };
          queryClient.setQueryData(['applications'], (old = []) => [tempApp, ...old]);
        }
      }
      return { previousApps };
    },
    onError: (err, variables, context) => {
      if (context?.previousApps) {
        queryClient.setQueryData(['applications'], context.previousApps);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/applications/${id}`);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['applications'] });
      const previousApps = queryClient.getQueryData(['applications']);
      if (previousApps) {
        queryClient.setQueryData(['applications'], (old = []) =>
          old.filter((a) => a.id !== id)
        );
      }
      return { previousApps };
    },
    onError: (err, id, context) => {
      if (context?.previousApps) {
        queryClient.setQueryData(['applications'], context.previousApps);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const handleSaveApplication = async (formData) => {
    saveMutation.mutate({ editingId: editingApp?.id, formData });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this application?")) return;
    deleteMutation.mutate(id);
  };

  const handleExport = async (format) => {
    try {
      const res = await api.get(`/applications/export?format=${format}`, { responseType: "blob" });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `hireiq-applications.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { console.error("Export failed:", err); }
  };

  const getInterviewBadge = (dateStr) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    if (isNaN(target)) return null;
    const now  = new Date();
    const ms   = target - now;
    const hrs  = ms / 3600000;
    const days = Math.ceil(ms / 86400000);
    const isToday =
      target.getDate() === now.getDate() &&
      target.getMonth() === now.getMonth() &&
      target.getFullYear() === now.getFullYear();

    if (isToday) return { text: "Interview TODAY", style: { color: "var(--stamp-green)", borderColor: "var(--stamp-green)" } };
    if (ms < 0)  return { text: "Interview passed", style: { color: "var(--stamp-grey)", borderColor: "var(--stamp-grey)" } };
    if (hrs < 24) return { text: `~${Math.max(1,Math.round(hrs))}h`, style: { color: "var(--stamp-amber)", borderColor: "var(--stamp-amber)" } };
    return { text: `In ${days}d`, style: { color: "var(--stamp-blue)", borderColor: "var(--stamp-blue)" } };
  };

  const allTags     = Array.from(new Set(applications.flatMap((a) => a.tags || [])));
  const filteredApps = applications.filter((a) => {
    const matchSearch = a.company?.toLowerCase().includes(search.toLowerCase()) ||
                        a.role?.toLowerCase().includes(search.toLowerCase());
    const matchTag    = !selectedTag   || (a.tags && a.tags.includes(selectedTag));
    const matchStatus = !statusFilter  || a.status === statusFilter;
    return matchSearch && matchTag && matchStatus;
  });

  return (
    <div
      style={{ padding: "2rem 1.5rem", maxWidth: 1400, margin: "0 auto" }}
    >
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div className="tape-label" style={{ marginBottom: "0.5rem" }}>your pipeline</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
              Applications
            </h1>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "var(--grey)", marginTop: "0.2rem" }}>
              {applications.length} total · {filteredApps.length} shown
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            {/* Export */}
            <div style={{ display: "flex", border: "1.5px solid var(--ink)", borderRadius: "2px", overflow: "hidden" }}>
              <button
                onClick={() => handleExport("csv")}
                style={{
                  fontFamily: "var(--font-stamp)", fontSize: "0.65rem", letterSpacing: "0.08em",
                  textTransform: "uppercase", padding: "0.45rem 0.75rem", background: "transparent",
                  color: "var(--ink)", border: "none", borderRight: "1px solid var(--ink)",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem",
                }}
                title="Export as CSV"
              >
                <Download size={11} /> CSV
              </button>
              <button
                onClick={() => handleExport("json")}
                style={{
                  fontFamily: "var(--font-stamp)", fontSize: "0.65rem", letterSpacing: "0.08em",
                  textTransform: "uppercase", padding: "0.45rem 0.75rem", background: "transparent",
                  color: "var(--ink)", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "0.3rem",
                }}
                title="Export as JSON"
              >
                JSON
              </button>
            </div>

            <button onClick={() => setCalcOpen(true)} className="btn-cork-outline" style={{ fontSize: "0.78rem" }}>
              <Calculator size={14} /> <span className="hidden sm:inline">Compare Offers</span>
            </button>

            <button
              onClick={() => { setEditingApp(null); setAppModalOpen(true); }}
              className="btn-cork"
            >
              <Plus size={14} /> Add Application
            </button>
          </div>
        </div>
      </div>

      {/* ── Search + Status Filter + View Toggle ───────────────────────── */}
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1rem" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1", minWidth: 200, maxWidth: 320 }}>
          <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--grey)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cork-input"
            style={{ paddingTop: "0.55rem", paddingBottom: "0.55rem" }}
          />
        </div>

        {/* Status filter */}
        <div style={{ position: "relative" }}>
          <Filter size={13} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--grey)", pointerEvents: "none" }} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="cork-input"
            style={{ paddingTop: "0.55rem", paddingBottom: "0.55rem", paddingRight: "2rem", minWidth: 140, appearance: "none", cursor: "pointer" }}
          >
            <option value="">All Statuses</option>
            {COLUMNS.map((col) => <option key={col.id} value={col.id}>{col.label}</option>)}
          </select>
        </div>

        {/* View toggle */}
        <div style={{ display: "flex", border: "1.5px solid rgba(31,28,23,0.2)", borderRadius: "2px", overflow: "hidden" }}>
          {[
            { id: "kanban", Icon: LayoutGrid, label: "Kanban Board" },
            { id: "table",  Icon: TableIcon,  label: "Table View"   },
          ].map(({ id, Icon, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              title={label}
              style={{
                padding: "0.45rem 0.6rem",
                background: view === id ? "var(--ink)" : "transparent",
                color: view === id ? "var(--wall)" : "var(--grey)",
                border: "none",
                cursor: "pointer",
                display: "flex", alignItems: "center",
                transition: "background 0.15s",
                borderRight: id === "kanban" ? "1px solid rgba(31,28,23,0.2)" : "none",
              }}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Tag Filter Chips ─────────────────────────────────────────────── */}
      {allTags.length > 0 && (
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1.25rem" }}>
          <span style={{ fontFamily: "var(--font-stamp)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--grey)" }}>Tags:</span>
          {["", ...allTags].map((tag) => (
            <button
              key={tag || "all"}
              onClick={() => setSelectedTag(tag)}
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.75rem",
                padding: "0.25rem 0.65rem",
                border: "1px solid",
                borderColor: selectedTag === tag ? "var(--ink)" : "rgba(31,28,23,0.2)",
                background: selectedTag === tag ? "var(--ink)" : "var(--tape)",
                color: selectedTag === tag ? "var(--wall)" : "var(--ink)",
                borderRadius: "1px",
                cursor: "pointer",
                transform: "rotate(-0.5deg)",
                transition: "all 0.1s",
              }}
            >
              {tag ? `#${tag}` : "All"}
            </button>
          ))}
        </div>
      )}

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "5rem 0" }}>
          <div className="cork-spinner" />
        </div>
      ) : applications.length === 0 ? (
        /* Empty state */
        <div className="cork-card-flat" style={{ maxWidth: 400, margin: "3rem auto", textAlign: "center" }}>
          <Building2 size={36} style={{ color: "var(--grey)", margin: "0 auto 1rem" }} />
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--ink)", marginBottom: "0.5rem" }}>
            Nothing pinned yet
          </h3>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem", color: "var(--grey)", marginBottom: "1.25rem" }}>
            Start tracking your job search — add your first application to the board.
          </p>
          <button
            onClick={() => { setEditingApp(null); setAppModalOpen(true); }}
            className="btn-cork"
            style={{ margin: "0 auto" }}
          >
            <Plus size={14} /> Add First Application
          </button>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="cork-card-flat" style={{ maxWidth: 360, margin: "2rem auto", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-ui)", color: "var(--grey)", marginBottom: "0.75rem" }}>
            No applications match your filters.
          </p>
          <button
            onClick={() => { setSearch(""); setSelectedTag(""); setStatusFilter(""); }}
            className="btn-string"
          >
            Clear filters
          </button>
        </div>
      ) : view === "kanban" ? (
        /* ── KANBAN CORKBOARD ─────────────────────────────────────────── */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", alignItems: "start" }}>
          {COLUMNS.filter((col) => statusFilter ? col.id === statusFilter : true).map((col) => {
            const colApps = filteredApps.filter((a) => a.status === col.id);
            return (
              <div key={col.id} className="cork-lane">
                {/* Column header stamp */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: "1px dashed rgba(31,28,23,0.15)" }}>
                  <span className={`stamp ${col.stampClass}`}>{col.label}</span>
                  <span style={{ fontFamily: "var(--font-stamp)", fontSize: "0.65rem", color: "var(--grey)", letterSpacing: "0.06em" }}>
                    {colApps.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="cork-lane-scroll" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {colApps.map((app, i) => {
                    const badge = getInterviewBadge(app.interviewDate);
                    return (
                      <div
                        key={app.id}
                        className={`cork-card ${rotFor(i)}`}
                        style={{ marginTop: i === 0 ? "0.5rem" : 0 }}
                      >
                        {/* Interview countdown stamp */}
                        {badge && (
                          <div style={{ marginBottom: "0.5rem" }}>
                            <span
                              style={{
                                fontFamily: "var(--font-stamp)",
                                fontSize: "0.55rem",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                border: "1px solid",
                                borderColor: badge.style.borderColor,
                                color: badge.style.color,
                                padding: "1px 6px",
                                borderRadius: "2px",
                                display: "inline-block",
                              }}
                            >
                              📅 {badge.text}
                            </span>
                          </div>
                        )}

                        {/* Company + Role */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)", margin: 0, lineHeight: 1.3 }}>
                              {app.company}
                            </h4>
                            <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", color: "var(--grey)", margin: "0.15rem 0 0" }}>
                              {app.role}
                            </p>
                            {app.appliedAt && (
                              <p style={{ fontFamily: "var(--font-hand)", fontSize: "0.7rem", color: "var(--grey)", margin: "0.15rem 0 0", opacity: 0.75 }}>
                                {new Date(app.appliedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                                {getDaysSinceText(app) ? ` (${getDaysSinceText(app)})` : ""}
                              </p>
                            )}
                          </div>
                          {/* Edit / Delete — show on hover via opacity group */}
                          <div className="group" style={{ display: "flex", gap: "0.15rem", flexShrink: 0, marginLeft: "0.25rem" }}>
                            <button
                              onClick={() => { setEditingApp(app); setAppModalOpen(true); }}
                              className="btn-icon"
                              title="Edit"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(app.id)}
                              className="btn-icon btn-icon-danger"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Tags */}
                        {app.tags && app.tags.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.5rem" }}>
                            {app.tags.map((t) => (
                              <button
                                key={t}
                                onClick={(e) => { e.stopPropagation(); setSelectedTag(selectedTag === t ? "" : t); }}
                                style={{
                                  fontFamily: "var(--font-ui)",
                                  fontSize: "0.65rem",
                                  padding: "1px 6px",
                                  background: "var(--tape)",
                                  border: "none",
                                  borderRadius: "1px",
                                  color: "var(--ink)",
                                  cursor: "pointer",
                                }}
                              >
                                #{t}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Notes */}
                        {app.notes && (
                          <p style={{
                            fontFamily: "var(--font-hand)",
                            fontSize: "0.78rem",
                            color: "var(--grey)",
                            background: "var(--wall-2)",
                            padding: "0.35rem 0.5rem",
                            borderRadius: "1px",
                            marginTop: "0.5rem",
                            lineHeight: 1.4,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}>
                            {app.notes}
                          </p>
                        )}

                        {/* Card footer — AI Score + Remind + Resume */}
                        <hr className="cork-divider" />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "var(--font-stamp)", fontSize: "0.62rem", color: "var(--grey)", letterSpacing: "0.04em", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                            ⏱️ {getDaysSinceText(app) || "Recently"}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0 }}>
                            <button
                              onClick={() => setAiApp(app)}
                              className="btn-icon"
                              style={{ color: "var(--stamp-blue)" }}
                              title="AI Score & Insights"
                            >
                              <Sparkles size={14} />
                            </button>
                            {app.resume?.id && (
                              <button
                                onClick={(e) => handleDownloadResume(app, e)}
                                disabled={downloadingResumeId === app.resume.id}
                                className="btn-icon"
                                style={{ color: "var(--stamp-green)" }}
                                title={`Download attached resume: ${app.resume.label}`}
                              >
                                {downloadingResumeId === app.resume.id ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Download size={14} />}
                              </button>
                            )}
                            <button
                              onClick={() => setReminderApp(app)}
                              className="btn-icon"
                              style={{ color: "var(--string)" }}
                              title="Set or View Reminder"
                            >
                              <Bell size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {colApps.length === 0 && (
                    <p style={{ fontFamily: "var(--font-hand)", fontSize: "0.8rem", color: "var(--grey)", textAlign: "center", padding: "2rem 0", opacity: 0.6 }}>
                      nothing here yet
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── TABLE VIEW ──────────────────────────────────────────────────── */
        <div className="cork-card-flat" style={{ padding: 0, paddingTop: 0, overflow: "hidden" }}>
          {/* remove the pseudo pin on the table wrapper */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-ui)", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "var(--wall-2)", borderBottom: "1px solid rgba(31,28,23,0.12)" }}>
                  {["Company","Role","Status","Applied","Tags","Actions"].map((h, i) => (
                    <th key={h} style={{
                      padding: "0.75rem 1rem",
                      fontFamily: "var(--font-stamp)",
                      fontSize: "0.6rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--grey)",
                      fontWeight: 400,
                      textAlign: i === 5 ? "right" : "left",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app, rowI) => {
                  const col   = COLUMNS.find((c) => c.id === app.status) || COLUMNS[0];
                  const badge = getInterviewBadge(app.interviewDate);
                  return (
                    <tr
                      key={app.id}
                      style={{
                        borderBottom: "1px solid rgba(31,28,23,0.07)",
                        background: rowI % 2 === 0 ? "var(--card)" : "var(--wall)",
                      }}
                    >
                      <td style={{ padding: "0.8rem 1rem" }}>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "var(--ink)" }}>
                          {app.company}
                        </div>
                        {badge && (
                          <span style={{
                            fontFamily: "var(--font-stamp)", fontSize: "0.55rem", letterSpacing: "0.07em",
                            textTransform: "uppercase", border: "1px solid", borderColor: badge.style.borderColor,
                            color: badge.style.color, padding: "0 5px", borderRadius: "1px",
                            display: "inline-block", marginTop: "0.2rem",
                          }}>
                            📅 {badge.text}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "0.8rem 1rem", color: "var(--grey)", fontFamily: "var(--font-ui)" }}>
                        {app.role}
                      </td>
                      <td style={{ padding: "0.8rem 1rem" }}>
                        <span className={`stamp ${col.stampClass}`}>{col.label}</span>
                      </td>
                      <td style={{ padding: "0.8rem 1rem", color: "var(--grey)", fontSize: "0.78rem" }}>
                        <div style={{ fontWeight: 500, color: "var(--ink)" }}>{app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "—"}</div>
                        {getDaysSinceText(app) && <div style={{ fontFamily: "var(--font-stamp)", fontSize: "0.65rem", color: "var(--grey)", marginTop: "0.2rem" }}>⏱️ {getDaysSinceText(app)}</div>}
                      </td>
                      <td style={{ padding: "0.8rem 1rem" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                          {(app.tags || []).map((t) => (
                            <span key={t} style={{ fontFamily: "var(--font-ui)", fontSize: "0.65rem", padding: "1px 6px", background: "var(--tape)", borderRadius: "1px", color: "var(--ink)" }}>
                              #{t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: "0.8rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.35rem", flexWrap: "wrap" }}>
                          <button onClick={() => setAiApp(app)} className="btn-icon" style={{ color: "var(--stamp-blue)" }} title="AI Score & Insights"><Sparkles size={15} /></button>
                          {app.resume?.id && (
                            <button
                              onClick={(e) => handleDownloadResume(app, e)}
                              disabled={downloadingResumeId === app.resume.id}
                              className="btn-icon"
                              style={{ color: "var(--stamp-green)" }}
                              title={`Download attached resume: ${app.resume.label}`}
                            >
                              {downloadingResumeId === app.resume.id ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Download size={15} />}
                            </button>
                          )}
                          <button onClick={() => setReminderApp(app)} className="btn-icon" style={{ color: "var(--string)" }} title="Set or View Reminder"><Bell size={15} /></button>
                          <button onClick={() => { setEditingApp(app); setAppModalOpen(true); }} className="btn-icon" title="Edit Application"><Edit2 size={15} /></button>
                          <button onClick={() => handleDelete(app.id)} className="btn-icon btn-icon-danger" title="Delete Application"><Trash2 size={15} /></button>
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

      {/* ── Modals (logic unchanged) ─────────────────────────────────────── */}
      <ApplicationModal
        isOpen={appModalOpen}
        onClose={() => setAppModalOpen(false)}
        onSave={handleSaveApplication}
        initialData={editingApp}
      />
      <AiScoreModal isOpen={!!aiApp} onClose={() => setAiApp(null)} application={aiApp} />
      <ReminderModal isOpen={!!reminderApp} onClose={() => setReminderApp(null)} application={reminderApp} />
      <OfferCalculatorModal isOpen={calcOpen} onClose={() => setCalcOpen(false)} />
    </div>
  );
};
