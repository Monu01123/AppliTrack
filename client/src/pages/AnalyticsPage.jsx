// src/pages/AnalyticsPage.jsx
//
// Interactive Analytics & Conversion Funnel Dashboard using Recharts.

import React, { useState, useEffect } from "react";
import api from "../lib/api";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Award,
  Briefcase,
  AlertCircle,
  BarChart3,
  PieChart as PieIcon,
} from "lucide-react";

const COLORS = {
  APPLIED: "#0ea5e9",      // sky-500
  PHONE_SCREEN: "#a855f7", // purple-500
  INTERVIEW: "#f59e0b",    // amber-500
  OFFER: "#10b981",        // emerald-500
  REJECTED: "#f43f5e",     // rose-500
  GHOSTED: "#64748b",      // slate-500
};

export const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="glass-card p-6 border-rose-500/30 bg-rose-500/10 text-rose-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error || "No analytics data available."}</span>
        </div>
      </div>
    );
  }

  // Prepare data for Recharts matching backend schema
  const totalApps = data.total ?? data.totalApplications ?? 0;
  const interviewRate = data.interviewRate ?? data.conversionRates?.interviewRate ?? "0%";
  const offerRate = data.offerRate ?? data.conversionRates?.offerRate ?? "0%";

  const pieData = Array.isArray(data.byStatus)
    ? data.byStatus.map((item) => ({
        name: item.name.replace("_", " "),
        statusKey: item.name,
        value: item.count,
      }))
    : Object.entries(data.countsByStatus || {}).map(([status, count]) => ({
        name: status.replace("_", " "),
        statusKey: status,
        value: count,
      }));

  const barData = pieData;
  const activePipelineCount = pieData
    .filter((d) => d.statusKey === "PHONE_SCREEN" || d.statusKey === "INTERVIEW")
    .reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-sky-400" />
          Job Search Funnel Analytics
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Real-time metrics and conversion insights across your job applications.
        </p>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">
              Total Applications
            </span>
            <Briefcase className="w-5 h-5 text-sky-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">
            {totalApps}
          </p>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">
              Interview Conversion
            </span>
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">
            {interviewRate}
          </p>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">
              Offer Rate
            </span>
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">
            {offerRate}
          </p>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">
              Active Pipeline
            </span>
            <PieIcon className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">
            {activePipelineCount}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart: Status Breakdown */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-sky-400" />
            Application Status Distribution
          </h3>
          <div className="h-72 w-full">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No application data to display yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[entry.statusKey] || "#0ea5e9"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "0.75rem",
                      color: "#f8fafc",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            {pieData.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-300">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[entry.statusKey] || "#0ea5e9" }}
                />
                <span>
                  {entry.name}: <strong className="text-white">{entry.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart: Funnel Breakdown */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Stage-by-Stage Breakdown
          </h3>
          <div className="h-72 w-full">
            {barData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No application data to display yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "0.75rem",
                      color: "#f8fafc",
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell
                        key={`bar-${index}`}
                        fill={COLORS[entry.statusKey] || "#6366f1"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
