// src/pages/AnalyticsPage.jsx
//
// Funnel Stats — corkboard design system.
// All chart data, API calls, metrics, and logic are 100% unchanged.

import React, { useState, useEffect } from "react";
import api from "../lib/api";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, Award, Briefcase, AlertCircle, BarChart3,
  PieChart as PieIcon, Mail, Target, Flame,
} from "lucide-react";

// Updated chart colors to match corkboard palette
const COLORS = {
  APPLIED:      "#2F4B7C",  // --stamp-blue
  PHONE_SCREEN: "#6D3F96",  // --stamp-purple
  INTERVIEW:    "#8B5E00",  // --stamp-amber
  OFFER:        "#2D6A4F",  // --stamp-green
  REJECTED:     "#8A8A8A",  // --stamp-grey
  GHOSTED:      "#5C574C",  // --grey
};

// KPI card rotation pool
const ROTS = ["cork-card-r1","cork-card-r2","cork-card-r3","cork-card-r4"];

export const AnalyticsPage = () => {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [sendingDigest, setSendingDigest] = useState(false);
  const [digestMessage, setDigestMessage] = useState("");

  const handleSendDigest = async () => {
    setSendingDigest(true);
    setDigestMessage("");
    try {
      const res = await api.post("/analytics/digest");
      setDigestMessage(res.data.message || "Weekly digest sent!");
    } catch (err) {
      setDigestMessage("Failed to send weekly digest.");
      console.error(err);
    } finally {
      setSendingDigest(false);
    }
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get("/analytics/summary");
        setData(res.data);
      } catch (err) {
        setError("Failed to load analytics summary.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="cork-spinner" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: "2rem", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ background: "rgba(178,58,47,0.08)", border: "1px solid rgba(178,58,47,0.3)", borderRadius: 2, padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--string)" }}>
          <AlertCircle size={18} />
          <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.875rem" }}>{error || "No analytics data available."}</span>
        </div>
      </div>
    );
  }

  const totalApps          = data.total ?? data.totalApplications ?? 0;
  const interviewRate      = data.interviewRate ?? data.conversionRates?.interviewRate ?? "0%";
  const offerRate          = data.offerRate ?? data.conversionRates?.offerRate ?? "0%";

  const pieData = Array.isArray(data.byStatus)
    ? data.byStatus.map((item) => ({ name: item.name.replace("_", " "), statusKey: item.name, value: item.count }))
    : Object.entries(data.countsByStatus || {}).map(([status, count]) => ({ name: status.replace("_", " "), statusKey: status, value: count }));

  const barData            = pieData;
  const activePipelineCount = pieData
    .filter((d) => d.statusKey === "PHONE_SCREEN" || d.statusKey === "INTERVIEW")
    .reduce((acc, curr) => acc + curr.value, 0);

  const goals = data.goals || { dailyTarget: 3, applicationsToday: 0, streakDays: 0 };
  const goalPct = Math.min(100, Math.round((goals.applicationsToday / goals.dailyTarget) * 100));

  const KPI_TILES = [
    { label: "Total Applications", value: totalApps,           Icon: Briefcase,  rot: ROTS[0] },
    { label: "Interview Conversion", value: interviewRate,     Icon: TrendingUp, rot: ROTS[1] },
    { label: "Offer Rate",          value: offerRate,           Icon: Award,      rot: ROTS[2] },
    { label: "Active Pipeline",     value: activePipelineCount, Icon: PieIcon,    rot: ROTS[3] },
  ];

  const tooltipStyle = {
    backgroundColor: "var(--card)",
    border: "1px solid rgba(31,28,23,0.15)",
    borderRadius: 2,
    color: "var(--ink)",
    fontFamily: "var(--font-ui)",
    fontSize: 12,
  };

  return (
    <div style={{ padding: "2rem 1.5rem", maxWidth: 1200, margin: "0 auto" }}>

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="tape-label" style={{ marginBottom: "0.5rem" }}>your metrics</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
          Funnel Stats
        </h1>
        <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "var(--grey)", marginTop: "0.2rem" }}>
          Real-time metrics and conversion insights across your job applications.
        </p>
      </div>

      {/* ── Daily Goal & Streak ──────────────────────────────────────────── */}
      <div className="cork-card-flat" style={{ marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid rgba(31,28,23,0.15)", borderRadius: 2 }}>
            <Target size={18} style={{ color: "var(--stamp-green)" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: "0.875rem", color: "var(--ink)" }}>
                Daily Goal: {goals.applicationsToday} / {goals.dailyTarget} Applications Today
              </span>
              {goals.applicationsToday >= goals.dailyTarget && (
                <span style={{ fontFamily: "var(--font-stamp)", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", border: "1px solid var(--stamp-green)", color: "var(--stamp-green)", padding: "1px 6px", borderRadius: 2 }}>
                  🎯 Achieved
                </span>
              )}
            </div>
            {/* Progress bar */}
            <div style={{ width: 220, height: 5, background: "rgba(31,28,23,0.1)", borderRadius: 2, marginTop: "0.5rem", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${goalPct}%`, background: "var(--string)", borderRadius: 2, transition: "width 0.4s ease" }} />
            </div>
          </div>
        </div>

        {/* Streak badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", border: "1.5px solid rgba(139,94,0,0.35)", borderRadius: 2, padding: "0.35rem 0.75rem" }}>
          <Flame size={15} style={{ color: "var(--stamp-amber)" }} />
          <span style={{ fontFamily: "var(--font-hand)", fontSize: "0.9rem", color: "var(--stamp-amber)", fontWeight: 600 }}>
            {goals.streakDays} Day Streak
          </span>
        </div>
      </div>

      {/* ── Weekly Digest Banner ────────────────────────────────────────── */}
      <div className="cork-card-flat" style={{ marginBottom: "2rem", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
            <Mail size={16} style={{ color: "var(--stamp-blue)" }} />
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
              Weekly Progress Email Digest
            </h3>
            <span style={{ fontFamily: "var(--font-stamp)", fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", border: "1px solid var(--stamp-blue)", color: "var(--stamp-blue)", padding: "1px 6px", borderRadius: 2 }}>
              Automated Every Monday @ 9 AM
            </span>
          </div>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "var(--grey)", margin: 0 }}>
            Get an automated weekly email summarizing your application velocity, upcoming interviews, and offer rates.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {digestMessage && (
            <span style={{ fontFamily: "var(--font-hand)", fontSize: "0.85rem", color: digestMessage.includes("Failed") ? "var(--string)" : "var(--stamp-green)" }}>
              {digestMessage}
            </span>
          )}
          <button
            onClick={handleSendDigest}
            disabled={sendingDigest}
            className="btn-cork"
            style={{ fontSize: "0.78rem" }}
          >
            <Mail size={13} />
            {sendingDigest ? "Sending…" : "Send Test Digest Now"}
          </button>
        </div>
      </div>

      {/* ── KPI Stat Tiles ──────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        {KPI_TILES.map(({ label, value, Icon, rot }, i) => (
          <div key={label} className={`cork-stat-card ${rot}`} style={{ marginTop: i % 2 === 0 ? 0 : "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontFamily: "var(--font-stamp)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--grey)" }}>
                {label}
              </span>
              <Icon size={15} style={{ color: "var(--grey)", flexShrink: 0 }} />
            </div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "2.25rem", fontWeight: 700, color: "var(--ink)", margin: 0, lineHeight: 1 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Charts Grid ─────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Donut chart */}
        <div className="cork-card-flat">
          <div style={{ marginBottom: "1rem" }}>
            <div className="tape-label" style={{ marginBottom: "0.4rem" }}>by status</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
              Application Status Distribution
            </h3>
          </div>
          <div style={{ height: 260 }}>
            {pieData.length === 0 ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--grey)", fontFamily: "var(--font-hand)", fontSize: "0.9rem" }}>
                no data to display yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={`c-${i}`} fill={COLORS[entry.statusKey] || "#5C574C"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", justifyContent: "center", paddingTop: "0.75rem", borderTop: "1px dashed rgba(31,28,23,0.12)" }}>
            {pieData.map((entry, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontFamily: "var(--font-ui)", fontSize: "0.75rem", color: "var(--grey)" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[entry.statusKey] || "#5C574C", display: "inline-block", flexShrink: 0 }} />
                {entry.name}: <strong style={{ color: "var(--ink)" }}>{entry.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div className="cork-card-flat">
          <div style={{ marginBottom: "1rem" }}>
            <div className="tape-label" style={{ marginBottom: "0.4rem" }}>stage breakdown</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
              Stage-by-Stage Breakdown
            </h3>
          </div>
          <div style={{ height: 260 }}>
            {barData.length === 0 ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--grey)", fontFamily: "var(--font-hand)", fontSize: "0.9rem" }}>
                no data to display yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="var(--grey)" fontSize={10} fontFamily="var(--font-stamp)" interval={0} angle={-35} textAnchor="end" height={60} />
                  <YAxis stroke="var(--grey)" fontSize={10} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={`b-${i}`} fill={COLORS[entry.statusKey] || "#5C574C"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Tag Distribution ────────────────────────────────────────────── */}
      {data.tagCounts && data.tagCounts.length > 0 && (
        <div className="cork-card-flat">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div>
              <div className="tape-label" style={{ marginBottom: "0.4rem" }}>sourcing</div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
                Tag Distribution & Sourcing Insights
              </h3>
            </div>
            <span style={{ fontFamily: "var(--font-hand)", fontSize: "0.8rem", color: "var(--grey)" }}>by custom labels</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1.25rem" }}>
            {data.tagCounts.map((tc, i) => (
              <div key={tc.tag} className={`cork-stat-card ${ROTS[i % ROTS.length]}`}>
                <span style={{ fontFamily: "var(--font-stamp)", fontSize: "0.62rem", letterSpacing: "0.08em", color: "var(--stamp-blue)", display: "block", marginBottom: "0.4rem" }}>
                  #{tc.tag}
                </span>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, color: "var(--ink)" }}>
                    {tc.count}
                  </span>
                  <span style={{ fontFamily: "var(--font-hand)", fontSize: "0.7rem", color: "var(--grey)" }}>
                    {data.total > 0 ? Math.round((tc.count / data.total) * 100) + "%" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
