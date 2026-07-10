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
  Target,
  Flame,
  Edit3,
  Download,
  Calculator,
  TrendingUp,
  Send,
} from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { ApplicationModal } from "../components/ApplicationModal";
import { AiScoreModal } from "../components/AiScoreModal";
import { ReminderModal } from "../components/ReminderModal";
import { OfferCalculatorModal } from "../components/OfferCalculatorModal";

const COLUMNS = [
  { id: "APPLIED", label: "Applied", color: "border-sky-500/40 bg-sky-500/10 text-sky-300" },
  { id: "PHONE_SCREEN", label: "Phone Screen", color: "border-purple-500/40 bg-purple-500/10 text-purple-300" },
  { id: "INTERVIEW", label: "Interview", color: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
  { id: "OFFER", label: "Offer", color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
  { id: "REJECTED", label: "Rejected", color: "border-rose-500/40 bg-rose-500/10 text-rose-300" },
  { id: "GHOSTED", label: "Ghosted", color: "border-slate-700 bg-slate-800 text-slate-400" },
];

export const DashboardPage = () => {
  const { user } = useAuth();
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
  const [calcOpen, setCalcOpen] = useState(false);

  const handleExport = async (format) => {
    try {
      const res = await api.get(`/applications/export?format=${format}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `hireiq-applications-backup.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

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

  // Daily Target & Streak State
  const [goals, setGoals] = useState({ dailyTarget: 3, applicationsToday: 0, streakDays: 0 });
  const [editingGoal, setEditingGoal] = useState(false);
  const [newTargetVal, setNewTargetVal] = useState(3);
  const [savingGoal, setSavingGoal] = useState(false);

  const fetchGoals = async () => {
    try {
      const res = await api.get("/analytics/goals");
      setGoals(res.data);
      setNewTargetVal(res.data.dailyTarget);
    } catch (err) {
      console.error("Failed to fetch goal stats:", err);
    }
  };

  const handleUpdateGoal = async (e) => {
    e.preventDefault();
    setSavingGoal(true);
    try {
      const res = await api.patch("/analytics/goals", { dailyTarget: Number(newTargetVal) });
      setGoals(res.data);
      setEditingGoal(false);
    } catch (err) {
      console.error("Failed to update goal:", err);
    } finally {
      setSavingGoal(false);
    }
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
    fetchGoals();
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
    fetchGoals();
  };

  // Delete Application
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;
    try {
      await api.delete(`/applications/${id}`);
      setApplications((prev) => prev.filter((item) => item.id !== id));
      fetchGoals();
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

  // Computed Funnel & Overview Metrics
  const totalApps = (Array.isArray(applications) ? applications : []).length;
  const appliedCount = (Array.isArray(applications) ? applications : []).filter((a) => a.status === "APPLIED").length;
  const phoneCount = (Array.isArray(applications) ? applications : []).filter((a) => a.status === "PHONE_SCREEN").length;
  const interviewCount = (Array.isArray(applications) ? applications : []).filter((a) => a.status === "INTERVIEW").length;
  const offerCount = (Array.isArray(applications) ? applications : []).filter((a) => a.status === "OFFER").length;
  const rejectedCount = (Array.isArray(applications) ? applications : []).filter((a) => a.status === "REJECTED").length;

  const interviewRate = totalApps > 0 ? Math.round(((phoneCount + interviewCount + offerCount) / totalApps) * 100) : 0;
  const offerRate = totalApps > 0 ? Math.round((offerCount / totalApps) * 100) : 0;

  const upcomingReminders = (Array.isArray(applications) ? applications : [])
    .filter((a) => a.interviewDate)
    .sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 text-[#2D2B2A]">
      {/* Top Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Carved Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#6E6B6B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search jobs, companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input py-2.5"
          />
        </div>

        {/* Action Controls & View Toggles */}
        <div className="flex items-center gap-3">
          <div className="flex bg-[#F3F1EC] border border-[#E5E1D8] p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setView("kanban")}
              title="Kanban Board"
              className={`p-2 rounded-lg text-sm transition-all ${
                view === "kanban"
                  ? "bg-[#FAF9F6] text-[#2D2B2A] shadow-sm font-semibold"
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
                  ? "bg-[#FAF9F6] text-[#2D2B2A] shadow-sm font-semibold"
                  : "text-[#6E6B6B] hover:text-[#2D2B2A]"
              }`}
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setCalcOpen(true)}
            className="btn-secondary text-xs flex items-center gap-1.5 py-2.5"
            title="Compare Offers"
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
            <span>Add Application</span>
          </button>

          <button className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#EBE8E1] text-[#6E6B6B] hover:text-[#2D2B2A] shadow-sm">
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Welcome Back Header Section */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#2D2B2A] tracking-tight">
          Welcome back, {user?.name || "monu"} 👋
        </h1>
        <p className="text-sm text-[#6E6B6B] mt-1">
          Track smarter. Apply better. Get hired.
        </p>
      </div>

      {/* 4 Tactile Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="tactile-card p-5 space-y-3">
          <p className="text-xs font-semibold text-[#6E6B6B] uppercase tracking-wider">
            Total Applications
          </p>
          <p className="text-3xl font-extrabold text-[#2D2B2A]">{totalApps}</p>
          <p className="text-xs font-medium text-[#7A8B78] flex items-center gap-1">
            <span>↑ 12% this week</span>
          </p>
        </div>

        <div className="tactile-card p-5 space-y-3">
          <p className="text-xs font-semibold text-[#6E6B6B] uppercase tracking-wider">
            Interview Rate
          </p>
          <p className="text-3xl font-extrabold text-[#2D2B2A]">{interviewRate}%</p>
          <p className="text-xs font-medium text-[#7A8B78] flex items-center gap-1">
            <span>↑ 4% this week</span>
          </p>
        </div>

        <div className="tactile-card p-5 space-y-3">
          <p className="text-xs font-semibold text-[#6E6B6B] uppercase tracking-wider">
            Offer Rate
          </p>
          <p className="text-3xl font-extrabold text-[#2D2B2A]">{offerRate}%</p>
          <p className="text-xs font-medium text-[#7A8B78] flex items-center gap-1">
            <span>↑ 2% this week</span>
          </p>
        </div>

        <div className="tactile-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl carved-box flex items-center justify-center text-[#BA6856]">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-[#2D2B2A]">
              {goals.streakDays || 1} Day Streak
            </p>
            <p className="text-xs text-[#6E6B6B]">Keep it up!</p>
          </div>
        </div>
      </div>

      {/* Funnel & Funnel Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carved Application Funnel Card */}
        <div className="tactile-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#2D2B2A]">Application Funnel</h3>
            <span className="text-xs font-medium text-[#6E6B6B] bg-[#F3F1EC] px-2.5 py-1 rounded-lg border border-[#E5E1D8]">
              This Month v
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            {/* Tactile Carved Funnel Graphic */}
            <div className="space-y-2 py-2">
              <div className="w-full h-8 carved-box rounded-lg flex items-center justify-center text-[10px] text-[#6E6B6B]">
                Applied
              </div>
              <div className="w-5/6 mx-auto h-7 carved-box rounded-lg flex items-center justify-center text-[10px] text-[#6E6B6B]">
                Screen
              </div>
              <div className="w-4/6 mx-auto h-6 carved-box rounded-lg flex items-center justify-center text-[10px] text-[#6E6B6B]">
                Interview
              </div>
              <div className="w-3/6 mx-auto h-5 carved-box rounded-lg flex items-center justify-center text-[10px] text-[#6E6B6B]">
                Offer
              </div>
            </div>

            {/* Funnel Stage Metric Legend */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between font-medium">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#B5A397]" /> Applied
                </span>
                <span className="font-bold text-[#2D2B2A]">{appliedCount}</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#9C8170]" /> Phone Screen
                </span>
                <span className="font-bold text-[#2D2B2A]">{phoneCount}</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D6C7BC]" /> Interview
                </span>
                <span className="font-bold text-[#2D2B2A]">{interviewCount}</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#7A8B78]" /> Offer
                </span>
                <span className="font-bold text-[#2D2B2A]">{offerCount}</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#BA6856]" /> Rejected
                </span>
                <span className="font-bold text-[#2D2B2A]">{rejectedCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Funnel Overview Horizontal Bars Card */}
        <div className="tactile-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#2D2B2A]">Funnel Overview</h3>
            <span className="text-xs font-medium text-[#6E6B6B] bg-[#F3F1EC] px-2.5 py-1 rounded-lg border border-[#E5E1D8]">
              This Month v
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                <span className="text-[#6E6B6B]">Applied</span>
                <span className="font-bold text-[#2D2B2A]">{appliedCount}</span>
              </div>
              <div className="w-full h-3 carved-box rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${totalApps ? Math.min(100, (appliedCount / totalApps) * 100) : 100}%`,
                    background: "linear-gradient(90deg, #9C8170, #D6C7BC)",
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                <span className="text-[#6E6B6B]">Phone Screen</span>
                <span className="font-bold text-[#2D2B2A]">{phoneCount}</span>
              </div>
              <div className="w-full h-3 carved-box rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${totalApps ? Math.min(100, (phoneCount / totalApps) * 100) : 50}%`,
                    background: "linear-gradient(90deg, #9C8170, #B5A397)",
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                <span className="text-[#6E6B6B]">Interview</span>
                <span className="font-bold text-[#2D2B2A]">{interviewCount}</span>
              </div>
              <div className="w-full h-3 carved-box rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${totalApps ? Math.min(100, (interviewCount / totalApps) * 100) : 25}%`,
                    background: "linear-gradient(90deg, #B5A397, #D6C7BC)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Tactile Bottom Widget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upcoming Reminders Card */}
        <div className="tactile-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#2D2B2A]">Upcoming Reminders</h4>
            <span className="text-xs text-[#9C8170] font-semibold cursor-pointer hover:underline">
              View all
            </span>
          </div>

          <div className="space-y-3">
            {upcomingReminders.slice(0, 3).length === 0 ? (
              <p className="text-xs text-[#6E6B6B] italic">No upcoming reminders</p>
            ) : (
              upcomingReminders.slice(0, 3).map((rem) => (
                <div
                  key={rem.id}
                  className="flex items-center justify-between p-2.5 rounded-xl carved-box text-xs"
                >
                  <div>
                    <p className="font-bold text-[#2D2B2A]">{rem.company}</p>
                    <p className="text-[#6E6B6B] text-[11px]">{rem.role}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#6E6B6B]">
                    <span>{new Date(rem.interviewDate).toLocaleDateString([], { day: "numeric", month: "short" })}</span>
                    <Calendar className="w-3.5 h-3.5 text-[#9C8170]" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Insight Card */}
        <div className="tactile-card p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-[#2D2B2A] mb-2">AI Insight</h4>
            <p className="text-xs text-[#6E6B6B] leading-relaxed">
              You&apos;re most likely to get interview calls when applying early morning between{" "}
              <span className="font-bold text-[#2D2B2A]">10AM - 12PM</span>.
            </p>
          </div>
          <div className="h-16 carved-box rounded-xl flex items-center justify-center p-2 text-[#9C8170]">
            <TrendingUp className="w-6 h-6 opacity-60" />
            <span className="text-xs ml-2 font-medium">High response window active</span>
          </div>
        </div>

        {/* Weekly Progress Email Digest Card */}
        <div className="tactile-card p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-[#2D2B2A]">Weekly Progress Email Digest</h4>
              <span className="text-[10px] font-semibold bg-[#F3F1EC] text-[#6E6B6B] px-2 py-0.5 rounded border border-[#E5E1D8]">
                Automated Every Monday
              </span>
            </div>
            <p className="text-xs text-[#6E6B6B] leading-relaxed">
              Get a summary of your application activity, interview insights, and offer trends sent directly to your inbox.
            </p>
          </div>
          <button className="btn-secondary text-xs w-full py-2.5 font-semibold">
            Send Digest Now
          </button>
        </div>
      </div>

      {/* Tag Filter Chip Bar */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-[#6E6B6B] uppercase shrink-0">
            Filter by Tag:
          </span>
          <button
            onClick={() => setSelectedTag("")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              !selectedTag
                ? "bg-[#2D2B2A] text-[#FAF9F6] shadow"
                : "bg-[#FAF9F6] border border-[#EBE8E1] text-[#6E6B6B] hover:text-[#2D2B2A]"
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
                  ? "bg-[#2D2B2A] text-[#FAF9F6] shadow"
                  : "bg-[#FAF9F6] border border-[#EBE8E1] text-[#6E6B6B] hover:text-[#2D2B2A]"
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
                className="bg-[#F3F1EC] border border-[#E5E1D8] rounded-2xl p-3 space-y-3 min-h-[420px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <span
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${col.color}`}
                  >
                    {col.label}
                  </span>
                  <span className="text-xs font-mono text-[#6E6B6B] bg-[#FAF9F6] border border-[#EBE8E1] px-2 py-0.5 rounded-full">
                    {colApps.length}
                  </span>
                </div>

                {/* Cards List */}
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
                        <div>
                          <h4 className="font-bold text-[#2D2B2A] text-sm">
                            {app.company}
                          </h4>
                          <p className="text-xs text-[#6E6B6B] mt-0.5">
                            {app.role}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingApp(app);
                              setAppModalOpen(true);
                            }}
                            className="p-1.5 text-[#6E6B6B] hover:text-[#2D2B2A] rounded-lg hover:bg-[#F3F1EC]"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(app.id)}
                            className="p-1.5 text-[#6E6B6B] hover:text-[#BA6856] rounded-lg hover:bg-[#F3F1EC]"
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
          <div className="overflow-x-auto tactile-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EBE8E1] bg-[#F3F1EC] text-xs uppercase font-semibold text-[#6E6B6B]">
                  <th className="p-4">Company</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Applied Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE8E1] text-sm">
                {filteredApps.map((app) => {
                  const col = COLUMNS.find((c) => c.id === app.status) || COLUMNS[0];
                  return (
                    <tr key={app.id} className="hover:bg-[#F3F1EC]/60 transition-colors">
                      <td className="p-4 font-bold text-[#2D2B2A]">
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
                      <td className="p-4 text-[#6E6B6B]">{app.role}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${col.color}`}
                        >
                          {col.label}
                        </span>
                      </td>
                      <td className="p-4 text-[#6E6B6B] text-xs">
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setAiApp(app)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-[#FAF9F6] text-[#2D2B2A] border border-[#EBE8E1] hover:bg-[#F3F1EC]"
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
      <OfferCalculatorModal
        isOpen={calcOpen}
        onClose={() => setCalcOpen(false)}
      />
    </div>
  );
};
