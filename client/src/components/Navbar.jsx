// src/components/Navbar.jsx
//
// Vertical Sidebar (desktop) + Compact Header (mobile) — only real app routes.

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Briefcase,
  BarChart2,
  Bell,
  LogOut,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/",            label: "Overview",     Icon: LayoutDashboard },
  { to: "/applications",label: "Applications", Icon: Briefcase       },
  { to: "/analytics",   label: "Funnel",       Icon: BarChart2       },
  { to: "/reminders",   label: "Reminders",    Icon: Bell            },
];

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  const userInitial = (user.name || user.email || "U").charAt(0).toUpperCase();

  return (
    <>
      {/* ── Desktop Vertical Sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 min-h-screen bg-[#F7F6F3] border-r border-[#EBE8E1] p-5 justify-between select-none shrink-0">
        <div>
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 mb-8 px-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#FAF9F6] border border-[#EBE8E1] shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-[#9C8170]" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#2D2B2A]">
              HireIQ
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="space-y-1">
            {NAV_ITEMS.map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive(to)
                    ? "bg-[#FAF9F6] text-[#2D2B2A] border border-[#EBE8E1] shadow-[0_1px_6px_rgba(0,0,0,0.05)] font-semibold"
                    : "text-[#6E6B6B] hover:text-[#2D2B2A] hover:bg-[#FAF9F6]/70"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive(to) ? "text-[#9C8170]" : "text-[#B5A397]"
                  }`}
                />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* User Profile */}
        <div className="pt-4 border-t border-[#EBE8E1] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#EAE6DF] border border-[#DCD8CF] flex items-center justify-center text-sm font-bold text-[#2D2B2A] shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#2D2B2A] truncate leading-tight">
                {user.name || "User"}
              </p>
              <p className="text-[11px] text-[#6E6B6B] truncate leading-tight">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-2 rounded-lg text-[#B5A397] hover:text-[#BA6856] hover:bg-[#FAF9F6] transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Header ── */}
      <header className="md:hidden sticky top-0 z-50 bg-[#F7F6F3]/90 backdrop-blur-md border-b border-[#EBE8E1] px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FAF9F6] border border-[#EBE8E1] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-[#9C8170]" />
          </div>
          <span className="text-base font-bold text-[#2D2B2A]">HireIQ</span>
        </Link>

        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ to, Icon }) => (
            <Link
              key={to}
              to={to}
              className={`p-2 rounded-lg transition-colors ${
                isActive(to)
                  ? "text-[#2D2B2A] bg-[#FAF9F6] border border-[#EBE8E1]"
                  : "text-[#6E6B6B] hover:text-[#2D2B2A]"
              }`}
            >
              <Icon className="w-4 h-4" />
            </Link>
          ))}
          <button
            onClick={logout}
            className="p-2 rounded-lg text-[#B5A397] hover:text-[#BA6856]"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>
    </>
  );
};
