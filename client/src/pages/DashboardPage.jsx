// src/pages/DashboardPage.jsx
//
// Overview Dashboard — corkboard / pinned index card design system.
// All state, API calls, logic, modals, and views are 100% unchanged.

import React, { useState, useEffect } from "react";
import {
  Plus, Search, LayoutGrid, Table as TableIcon, Sparkles, Bell,
  Edit2, Trash2, Building2, Calendar, Share2, ExternalLink, Copy, Check,
  Target, Flame, Edit3, Download, Calculator, TrendingUp, Send, Loader2,
} from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { ApplicationModal }    from "../components/ApplicationModal";
import { AiScoreModal }        from "../components/AiScoreModal";
import { ReminderModal }       from "../components/ReminderModal";
import { OfferCalculatorModal } from "../components/OfferCalculatorModal";

const COLUMNS = [
  { id: "APPLIED",      label: "Applied",      stampClass: "stamp-applied",   accent: "var(--stamp-blue)"   },
  { id: "PHONE_SCREEN", label: "Phone Screen", stampClass: "stamp-phone",     accent: "var(--stamp-purple)" },
  { id: "INTERVIEW",    label: "Interview",    stampClass: "stamp-interview", accent: "var(--stamp-amber)"  },
  { id: "OFFER",        label: "Offer",        stampClass: "stamp-offer",     accent: "var(--stamp-green)"  },
  { id: "REJECTED",     label: "Rejected",     stampClass: "stamp-rejected",  accent: "var(--stamp-grey)"   },
  { id: "GHOSTED",      label: "Ghosted",      stampClass: "stamp-ghosted",   accent: "var(--stamp-grey)"   },
];

const ROTATIONS = ["cork-card-r1","cork-card-r2","cork-card-r3","cork-card-r4","cork-card-r5","cork-card-r6"];
const rotFor = (i) => ROTATIONS[i % ROTATIONS.length];

const FUNNEL_STAGES = [
  { key: "APPLIED",      label: "Applied",      color: "var(--stamp-blue)"   },
  { key: "PHONE_SCREEN", label: "Phone Screen", color: "var(--stamp-purple)" },
  { key: "INTERVIEW",    label: "Interview",    color: "var(--stamp-amber)"  },
  { key: "OFFER",        label: "Offer",        color: "var(--stamp-green)"  },
  { key: "REJECTED",     label: "Rejected",     color: "var(--stamp-grey)"   },
];

export const DashboardPage = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [selectedTag, setSelectedTag]   = useState("");
  const [view, setView]         = useState("kanban");

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

  const handleExport = async (format) => {
    try {
      const res  = await api.get(`/applications/export?format=${format}`, { responseType: "blob" });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `hireiq-applications-backup.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { console.error("Export failed:", err); }
  };

  // ── Public Profile Showcase ──────────────────────────────────────────────
  const [publicProfile, setPublicProfile] = useState(null);
  const [slugInput, setSlugInput]         = useState("");
  const [copiedLink, setCopiedLink]       = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg]       = useState("");

  const fetchPublicSettings = async () => {
    try {
      const res = await api.get("/auth/profile/public");
      setPublicProfile(res.data);
      setSlugInput(res.data.profileSlug || "");
    } catch (err) { console.error("Failed to fetch public profile settings:", err); }
  };

  const handleTogglePublic = async () => {
    if (!publicProfile) return;
    setSavingProfile(true);
    setProfileMsg("");
    try {
      const nextVal = !publicProfile.publicProfileEnabled;
      const res = await api.patch("/auth/profile/public", { publicProfileEnabled: nextVal });
      setPublicProfile(res.data);
      setProfileMsg(nextVal ? "Public showcase enabled!" : "Public showcase set to private.");
    } catch (err) {
      setProfileMsg("Failed to update public settings.");
    } finally { setSavingProfile(false); }
  };

  const handleSaveSlug = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    try {
      const res = await api.patch("/auth/profile/public", { profileSlug: slugInput || null });
      setPublicProfile(res.data);
      setProfileMsg("Profile slug saved!");
    } catch (err) {
      setProfileMsg(err.response?.data?.error || "Failed to save slug.");
    } finally { setSavingProfile(false); }
  };

  const handleCopyPublicLink = () => {
    if (!publicProfile) return;
    const identifier = publicProfile.profileSlug || publicProfile.id;
    const url = `${window.location.origin}/p/${identifier}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // ── Daily Target & Streak ────────────────────────────────────────────────
  const [goals, setGoals]           = useState({ dailyTarget: 3, applicationsToday: 0, streakDays: 0 });
  const [editingGoal, setEditingGoal] = useState(false);
  const [newTargetVal, setNewTargetVal] = useState(3);
  const [savingGoal, setSavingGoal] = useState(false);

  const fetchGoals = async () => {
    try {
      const res = await api.get("/analytics/goals");
      setGoals(res.data);
      setNewTargetVal(res.data.dailyTarget);
    } catch (err) { console.error("Failed to fetch goal stats:", err); }
  };

  const handleUpdateGoal = async (e) => {
    e.preventDefault();
    setSavingGoal(true);
    try {
      const res = await api.patch("/analytics/goals", { dailyTarget: Number(newTargetVal) });
      setGoals(res.data);
      setEditingGoal(false);
    } catch (err) { console.error("Failed to update goal:", err); }
    finally { setSavingGoal(false); }
  };

  // ── Applications ─────────────────────────────────────────────────────────
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res      = await api.get("/applications");
      const appsList = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setApplications(appsList);
    } catch (err) { console.error("Error loading applications:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchApplications();
    fetchPublicSettings();
    fetchGoals();
  }, []);

  const handleSaveApplication = async (formData) => {
    if (editingApp) {
      const res = await api.patch(`/applications/${editingApp.id}`, formData);
      setApplications((prev) => prev.map((a) => (a.id === editingApp.id ? res.data : a)));
    } else {
      const res = await api.post("/applications", formData);
      setApplications((prev) => [res.data, ...prev]);
    }
    fetchGoals();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;
    try {
      await api.delete(`/applications/${id}`);
      setApplications((prev) => prev.filter((a) => a.id !== id));
      fetchGoals();
    } catch (err) { console.error("Failed to delete application:", err); }
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const safeApps = Array.isArray(applications) ? applications : [];

  const allTags = Array.from(new Set(safeApps.flatMap((a) => a.tags || [])));

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

    if (isToday) return { text: "Interview TODAY", color: "var(--stamp-green)" };
    if (ms < 0)  return { text: "Interview passed", color: "var(--stamp-grey)" };
    if (hrs < 24) return { text: `~${Math.max(1, Math.round(hrs))}h`, color: "var(--stamp-amber)" };
    return { text: `In ${days}d`, color: "var(--stamp-blue)" };
  };

  const filteredApps = safeApps.filter((app) => {
    const matchSearch = app.company?.toLowerCase().includes(search.toLowerCase()) ||
                        app.role?.toLowerCase().includes(search.toLowerCase());
    const matchTag    = !selectedTag || (app.tags && app.tags.includes(selectedTag));
    return matchSearch && matchTag;
  });

  const totalApps      = safeApps.length;
  const interviewRate  = totalApps > 0
    ? Math.round((safeApps.filter((a) => ["PHONE_SCREEN","INTERVIEW","OFFER"].includes(a.status)).length / totalApps) * 100)
    : 0;
  const offerRate = totalApps > 0
    ? Math.round((safeApps.filter((a) => a.status === "OFFER").length / totalApps) * 100)
    : 0;

  const upcomingReminders = safeApps
    .filter((a) => a.interviewDate)
    .sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate));

  const goalPct = Math.min(100, Math.round((goals.applicationsToday / Math.max(1, goals.dailyTarget)) * 100));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "2rem 1.5rem", maxWidth: 1400, margin: "0 auto" }}>

      {/* ── Top action bar ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 360 }}>
          <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--grey)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search jobs, companies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cork-input"
            style={{ paddingTop: "0.55rem", paddingBottom: "0.55rem" }}
          />
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          {/* View toggle */}
          <div style={{ display: "flex", border: "1.5px solid rgba(31,28,23,0.2)", borderRadius: 2, overflow: "hidden" }}>
            {[
              { id: "kanban", Icon: LayoutGrid, label: "Kanban Board" },
              { id: "table",  Icon: TableIcon,  label: "Table View"   },
            ].map(({ id, Icon, label }) => (
              <button key={id} onClick={() => setView(id)} title={label} style={{ padding: "0.45rem 0.6rem", background: view === id ? "var(--ink)" : "transparent", color: view === id ? "var(--wall)" : "var(--grey)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", borderRight: id === "kanban" ? "1px solid rgba(31,28,23,0.2)" : "none", transition: "background 0.15s" }}>
                <Icon size={15} />
              </button>
            ))}
          </div>

          {/* Export */}
          <div style={{ display: "flex", border: "1.5px solid var(--ink)", borderRadius: 2, overflow: "hidden" }}>
            <button onClick={() => handleExport("csv")} style={{ fontFamily: "var(--font-stamp)", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.45rem 0.65rem", background: "transparent", color: "var(--ink)", border: "none", borderRight: "1px solid var(--ink)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }} title="Export CSV">
              <Download size={10} /> CSV
            </button>
            <button onClick={() => handleExport("json")} style={{ fontFamily: "var(--font-stamp)", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.45rem 0.65rem", background: "transparent", color: "var(--ink)", border: "none", cursor: "pointer" }} title="Export JSON">
              JSON
            </button>
          </div>

          <button onClick={() => setCalcOpen(true)} className="btn-cork-outline" style={{ fontSize: "0.78rem" }} title="Compare Offers">
            <Calculator size={13} /> <span className="hidden sm:inline">Compare Offers</span>
          </button>

          <button onClick={() => { setEditingApp(null); setAppModalOpen(true); }} className="btn-cork">
            <Plus size={14} /> Add Application
          </button>
        </div>
      </div>

      {/* ── Welcome Header ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div className="tape-label" style={{ marginBottom: "0.5rem" }}>overview</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, color: "var(--ink)", margin: "0 0 0.1rem" }}>
          Welcome back,{" "}
          <span style={{ fontFamily: "var(--font-hand)", fontWeight: 600, fontSize: "2.1rem" }}>
            {user?.name || "there"}
          </span>{" "}
          👋
        </h1>
        <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem", color: "var(--grey)" }}>
          Track smarter. Apply better. Get hired.
        </p>
      </div>

      {/* ── 4 KPI Stat Cards ─────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Applications", value: totalApps,         rot: "cork-card-r1", note: "" },
          { label: "Interview Rate",     value: `${interviewRate}%`, rot: "cork-card-r2", note: "" },
          { label: "Offer Rate",         value: `${offerRate}%`,    rot: "cork-card-r3", note: "" },
          { label: "Day Streak",         value: goals.streakDays || 1, rot: "cork-card-r4", note: "keep it up!" },
        ].map(({ label, value, rot, note }, i) => (
          <div key={label} className={`cork-stat-card ${rot}`} style={{ marginTop: i % 2 !== 0 ? "0.5rem" : 0 }}>
            <span style={{ fontFamily: "var(--font-stamp)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--grey)", display: "block", marginBottom: "0.5rem" }}>
              {label}
            </span>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "2.25rem", fontWeight: 700, color: "var(--ink)", margin: 0, lineHeight: 1 }}>
              {value}
            </p>
            {note && (
              <p style={{ fontFamily: "var(--font-hand)", fontSize: "0.75rem", color: "var(--grey)", marginTop: "0.25rem" }}>
                {note}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Daily Goal + Funnel Overview ────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>

        {/* Daily Goal card */}
        <div className="cork-card-flat">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
              Daily Application Target
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", border: "1px solid rgba(139,94,0,0.3)", borderRadius: 2, padding: "0.2rem 0.6rem" }}>
              <Flame size={13} style={{ color: "var(--stamp-amber)" }} />
              <span style={{ fontFamily: "var(--font-hand)", fontSize: "0.85rem", color: "var(--stamp-amber)", fontWeight: 600 }}>
                {goals.streakDays} Day Streak
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "var(--grey)" }}>
              {goals.applicationsToday} / {goals.dailyTarget} today
            </span>
            {goals.applicationsToday >= goals.dailyTarget && (
              <span className="stamp stamp-offer">🎯 Achieved</span>
            )}
          </div>
          <div style={{ width: "100%", height: 6, background: "rgba(31,28,23,0.1)", borderRadius: 2, overflow: "hidden", marginBottom: "0.75rem" }}>
            <div style={{ height: "100%", width: `${goalPct}%`, background: "var(--string)", borderRadius: 2, transition: "width 0.4s ease" }} />
          </div>

          {editingGoal ? (
            <form onSubmit={handleUpdateGoal} style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="number"
                min={1}
                max={50}
                value={newTargetVal}
                onChange={(e) => setNewTargetVal(e.target.value)}
                className="cork-input no-icon"
                style={{ padding: "0.4rem 0.6rem", width: 80, fontSize: "0.8rem" }}
              />
              <button type="submit" disabled={savingGoal} className="btn-cork" style={{ fontSize: "0.75rem", padding: "0.4rem 0.75rem" }}>
                {savingGoal ? "…" : "Save"}
              </button>
              <button type="button" onClick={() => setEditingGoal(false)} className="btn-cork-outline" style={{ fontSize: "0.75rem", padding: "0.4rem 0.75rem" }}>
                Cancel
              </button>
            </form>
          ) : (
            <button onClick={() => setEditingGoal(true)} className="btn-string" style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Edit3 size={12} /> Edit Goal
            </button>
          )}
        </div>

        {/* Funnel Overview bars */}
        <div className="cork-card-flat">
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--ink)", margin: "0 0 1rem" }}>
            Funnel Overview
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {FUNNEL_STAGES.map(({ key, label, color }) => {
              const count = safeApps.filter((a) => a.status === key).length;
              const pct   = totalApps > 0 ? Math.min(100, Math.round((count / totalApps) * 100)) : 0;
              return (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontFamily: "var(--font-stamp)", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--grey)" }}>{label}</span>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)" }}>{count}</span>
                  </div>
                  <div style={{ width: "100%", height: 5, background: "rgba(31,28,23,0.08)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom Widget Row ────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>

        {/* Upcoming Reminders */}
        <div className="cork-card-flat">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
              Upcoming Reminders
            </h4>
          </div>
          {upcomingReminders.length === 0 ? (
            <p style={{ fontFamily: "var(--font-hand)", fontSize: "0.82rem", color: "var(--grey)", opacity: 0.7 }}>No upcoming interviews</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {upcomingReminders.slice(0, 3).map((rem) => (
                <div key={rem.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.65rem", background: "var(--wall-2)", borderRadius: 2 }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", color: "var(--ink)", margin: 0 }}>{rem.company}</p>
                    <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "var(--grey)", margin: 0 }}>{rem.role}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--grey)" }}>
                    <span style={{ fontFamily: "var(--font-hand)", fontSize: "0.75rem" }}>
                      {new Date(rem.interviewDate).toLocaleDateString([], { day: "numeric", month: "short" })}
                    </span>
                    <Calendar size={12} style={{ color: "var(--stamp-amber)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Insight */}
        <div className="cork-card-flat" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--ink)", margin: "0 0 0.5rem" }}>AI Insight</h4>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "var(--grey)", lineHeight: 1.6, margin: 0 }}>
              You're most likely to get interview calls when applying early morning between{" "}
              <strong style={{ color: "var(--ink)" }}>10AM – 12PM</strong>.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem", padding: "0.5rem 0.65rem", background: "var(--wall-2)", borderRadius: 2 }}>
            <TrendingUp size={16} style={{ color: "var(--grey)" }} />
            <span style={{ fontFamily: "var(--font-stamp)", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--grey)" }}>High response window active</span>
          </div>
        </div>

        {/* Weekly Email Digest */}
        <div className="cork-card-flat" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>Weekly Email Digest</h4>
              <span style={{ fontFamily: "var(--font-stamp)", fontSize: "0.55rem", letterSpacing: "0.07em", textTransform: "uppercase", border: "1px solid var(--stamp-blue)", color: "var(--stamp-blue)", padding: "1px 6px", borderRadius: 2 }}>
                Mon @ 9 AM
              </span>
            </div>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "var(--grey)", lineHeight: 1.6, margin: 0 }}>
              Get a summary of your application activity, interviews, and offer trends in your inbox.
            </p>
          </div>
          <button className="btn-cork-outline" style={{ marginTop: "0.75rem", width: "100%", justifyContent: "center", fontSize: "0.78rem" }}>
            <Send size={12} /> Send Digest Now
          </button>
        </div>
      </div>

      {/* ── Shareable Public Showcase ────────────────────────────────────── */}
      {publicProfile && (
        <div className="cork-card-flat" style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <Share2 size={15} style={{ color: "var(--grey)" }} />
            <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
              Shareable Public Showcase
            </h4>
            <button
              onClick={handleTogglePublic}
              disabled={savingProfile}
              style={{
                marginLeft: "auto",
                fontFamily: "var(--font-stamp)",
                fontSize: "0.6rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                border: "1px solid",
                borderColor: publicProfile.publicProfileEnabled ? "var(--stamp-green)" : "var(--stamp-grey)",
                color: publicProfile.publicProfileEnabled ? "var(--stamp-green)" : "var(--stamp-grey)",
                background: "transparent",
                padding: "2px 8px",
                borderRadius: 2,
                cursor: "pointer",
              }}
            >
              {publicProfile.publicProfileEnabled ? "Public ✓" : "Private"}
            </button>
          </div>

          <form onSubmit={handleSaveSlug} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="text"
              placeholder="custom-slug"
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              className="cork-input no-icon"
              style={{ flex: 1, minWidth: 160, padding: "0.45rem 0.75rem", fontSize: "0.8rem" }}
            />
            <button type="submit" disabled={savingProfile} className="btn-cork" style={{ fontSize: "0.75rem", padding: "0.45rem 0.85rem" }}>
              Save Slug
            </button>
            {publicProfile.publicProfileEnabled && (
              <>
                <button type="button" onClick={handleCopyPublicLink} className="btn-cork-outline" style={{ fontSize: "0.75rem", padding: "0.45rem 0.75rem" }}>
                  {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                  {copiedLink ? "Copied!" : "Copy Link"}
                </button>
                <a
                  href={`/p/${publicProfile.profileSlug || publicProfile.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-cork-outline"
                  style={{ fontSize: "0.75rem", padding: "0.45rem 0.75rem", textDecoration: "none" }}
                >
                  <ExternalLink size={13} /> View
                </a>
              </>
            )}
          </form>

          {profileMsg && (
            <p style={{ fontFamily: "var(--font-hand)", fontSize: "0.8rem", color: profileMsg.includes("Failed") ? "var(--string)" : "var(--stamp-green)", marginTop: "0.4rem" }}>
              {profileMsg}
            </p>
          )}
        </div>
      )}

      {/* ── Tag Filter Chips ──────────────────────────────────────────────── */}
      {allTags.length > 0 && (
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1.25rem" }}>
          <span style={{ fontFamily: "var(--font-stamp)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--grey)" }}>Filter by Tag:</span>
          {["", ...allTags].map((tag) => (
            <button
              key={tag || "all"}
              onClick={() => setSelectedTag(tag)}
              style={{
                fontFamily: "var(--font-ui)", fontSize: "0.75rem",
                padding: "0.25rem 0.65rem",
                border: "1px solid",
                borderColor: selectedTag === tag ? "var(--ink)" : "rgba(31,28,23,0.2)",
                background: selectedTag === tag ? "var(--ink)" : "var(--tape)",
                color: selectedTag === tag ? "var(--wall)" : "var(--ink)",
                borderRadius: 1, cursor: "pointer", transform: "rotate(-0.5deg)", transition: "all 0.1s",
              }}
            >
              {tag ? `#${tag}` : `All (${applications.length})`}
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
        <div className="cork-card-flat" style={{ maxWidth: 400, margin: "2rem auto", textAlign: "center" }}>
          <Building2 size={36} style={{ color: "var(--grey)", margin: "0 auto 1rem", display: "block" }} />
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "var(--ink)", margin: "0 0 0.4rem" }}>Nothing pinned yet</h3>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "var(--grey)", margin: "0 0 1.25rem" }}>
            Start tracking your job search — add your first application to the board.
          </p>
          <button onClick={() => { setEditingApp(null); setAppModalOpen(true); }} className="btn-cork" style={{ margin: "0 auto" }}>
            <Plus size={14} /> Add First Application
          </button>
        </div>
      ) : view === "kanban" ? (
        /* ── KANBAN CORKBOARD ─────────────────────────────────────────── */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", alignItems: "start" }}>
          {COLUMNS.map((col) => {
            const colApps = filteredApps.filter((a) => a.status === col.id);
            return (
              <div key={col.id} className="cork-lane">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: "1px dashed rgba(31,28,23,0.15)" }}>
                  <span className={`stamp ${col.stampClass}`}>{col.label}</span>
                  <span style={{ fontFamily: "var(--font-stamp)", fontSize: "0.65rem", color: "var(--grey)", letterSpacing: "0.06em" }}>
                    {colApps.length}
                  </span>
                </div>

                <div className="cork-lane-scroll" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {colApps.map((app, i) => {
                    const badge = getInterviewBadge(app.interviewDate);
                    return (
                      <div key={app.id} className={`cork-card ${rotFor(i)}`} style={{ marginTop: i === 0 ? "0.5rem" : 0 }}>
                        {badge && (
                          <div style={{ marginBottom: "0.4rem" }}>
                            <span style={{ fontFamily: "var(--font-stamp)", fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", border: "1px solid", borderColor: badge.color, color: badge.color, padding: "0 6px", borderRadius: 2, display: "inline-block" }}>
                              📅 {badge.text}
                            </span>
                          </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "var(--ink)", margin: 0, lineHeight: 1.3 }}>{app.company}</h4>
                            <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "var(--grey)", margin: "0.15rem 0 0" }}>{app.role}</p>
                            {app.appliedAt && (
                              <p style={{ fontFamily: "var(--font-hand)", fontSize: "0.68rem", color: "var(--grey)", margin: "0.15rem 0 0", opacity: 0.65 }}>
                                {new Date(app.appliedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                              </p>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: "0.1rem", flexShrink: 0, marginLeft: "0.25rem" }}>
                            <button onClick={() => { setEditingApp(app); setAppModalOpen(true); }} className="btn-icon" title="Edit"><Edit2 size={11} /></button>
                            <button onClick={() => handleDelete(app.id)} className="btn-icon btn-icon-danger" title="Delete"><Trash2 size={11} /></button>
                          </div>
                        </div>

                        {app.tags && app.tags.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.4rem" }}>
                            {app.tags.map((t) => (
                              <button key={t} onClick={(e) => { e.stopPropagation(); setSelectedTag(selectedTag === t ? "" : t); }} style={{ fontFamily: "var(--font-ui)", fontSize: "0.62rem", padding: "1px 5px", background: "var(--tape)", border: "none", borderRadius: 1, color: "var(--ink)", cursor: "pointer" }}>
                                #{t}
                              </button>
                            ))}
                          </div>
                        )}

                        {app.notes && (
                          <p style={{ fontFamily: "var(--font-hand)", fontSize: "0.75rem", color: "var(--grey)", background: "var(--wall-2)", padding: "0.3rem 0.5rem", borderRadius: 1, marginTop: "0.4rem", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {app.notes}
                          </p>
                        )}

                        <hr className="cork-divider" />
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.25rem", flexWrap: "wrap" }}>
                          <button onClick={() => setAiApp(app)} className="btn-action" style={{ color: "var(--stamp-blue)" }}><Sparkles size={10} /> AI Score</button>
                          {app.resume?.id && (
                            <button
                              onClick={(e) => handleDownloadResume(app, e)}
                              disabled={downloadingResumeId === app.resume.id}
                              className="btn-action"
                              style={{ color: "var(--stamp-green)", borderColor: "rgba(74,124,89,0.3)", background: "rgba(74,124,89,0.06)" }}
                              title={`Download attached resume: ${app.resume.label}`}
                            >
                              {downloadingResumeId === app.resume.id ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : <Download size={10} />}
                              Resume
                            </button>
                          )}
                          <button onClick={() => setReminderApp(app)} className="btn-action" style={{ color: "var(--string)" }}><Bell size={10} /> Remind</button>
                        </div>
                      </div>
                    );
                  })}

                  {colApps.length === 0 && (
                    <p style={{ fontFamily: "var(--font-hand)", fontSize: "0.78rem", color: "var(--grey)", textAlign: "center", padding: "2rem 0", opacity: 0.5 }}>
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
        <div style={{ background: "var(--card)", borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-ui)", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "var(--wall-2)", borderBottom: "1px solid rgba(31,28,23,0.12)" }}>
                {["Company","Role","Status","Applied Date","Actions"].map((h, i) => (
                  <th key={h} style={{ padding: "0.75rem 1rem", fontFamily: "var(--font-stamp)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--grey)", fontWeight: 400, textAlign: i === 4 ? "right" : "left" }}>
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
                  <tr key={app.id} style={{ borderBottom: "1px solid rgba(31,28,23,0.07)", background: rowI % 2 === 0 ? "var(--card)" : "var(--wall)" }}>
                    <td style={{ padding: "0.8rem 1rem" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "var(--ink)" }}>{app.company}</div>
                      {badge && <span style={{ fontFamily: "var(--font-stamp)", fontSize: "0.55rem", letterSpacing: "0.07em", textTransform: "uppercase", border: "1px solid", borderColor: badge.color, color: badge.color, padding: "0 5px", borderRadius: 1, display: "inline-block", marginTop: "0.15rem" }}>📅 {badge.text}</span>}
                    </td>
                    <td style={{ padding: "0.8rem 1rem", color: "var(--grey)" }}>{app.role}</td>
                    <td style={{ padding: "0.8rem 1rem" }}>
                      <span className={`stamp ${col.stampClass}`}>{col.label}</span>
                    </td>
                    <td style={{ padding: "0.8rem 1rem", color: "var(--grey)", fontSize: "0.78rem" }}>
                      {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ padding: "0.8rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.4rem", flexWrap: "wrap" }}>
                        <button onClick={() => setAiApp(app)} className="btn-action" style={{ color: "var(--stamp-blue)" }}><Sparkles size={10} /> AI Score</button>
                        {app.resume?.id && (
                          <button
                            onClick={(e) => handleDownloadResume(app, e)}
                            disabled={downloadingResumeId === app.resume.id}
                            className="btn-action"
                            style={{ color: "var(--stamp-green)", borderColor: "rgba(74,124,89,0.3)", background: "rgba(74,124,89,0.06)" }}
                            title={`Download attached resume: ${app.resume.label}`}
                          >
                            {downloadingResumeId === app.resume.id ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : <Download size={10} />}
                            Resume
                          </button>
                        )}
                        <button onClick={() => setReminderApp(app)} className="btn-action" style={{ color: "var(--string)" }}><Bell size={10} /> Remind</button>
                        <button onClick={() => { setEditingApp(app); setAppModalOpen(true); }} className="btn-icon" title="Edit"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(app.id)} className="btn-icon btn-icon-danger" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <ApplicationModal isOpen={appModalOpen} onClose={() => setAppModalOpen(false)} onSave={handleSaveApplication} initialData={editingApp} />
      <AiScoreModal isOpen={!!aiApp} onClose={() => setAiApp(null)} application={aiApp} />
      <ReminderModal isOpen={!!reminderApp} onClose={() => setReminderApp(null)} application={reminderApp} />
      <OfferCalculatorModal isOpen={calcOpen} onClose={() => setCalcOpen(false)} />
    </div>
  );
};
