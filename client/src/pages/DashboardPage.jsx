// src/pages/DashboardPage.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import { Sparkles } from "lucide-react";

export const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="glass-card p-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-slate-400 mt-1">
            Your HireIQ dashboard is ready. Let's track some job applications!
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20">
          <Sparkles className="w-8 h-8 text-brand-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
};
