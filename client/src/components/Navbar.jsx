// src/components/Navbar.jsx
//
// Horizontal top-bar navigation — Corkboard design system.
// 3-column layout: Logo | Nav links (centered) | User info + Sign-out

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { to: "/",             label: "Overview"     },
  { to: "/applications", label: "Applications" },
  { to: "/analytics",    label: "Funnel Stats" },
  { to: "/reminders",    label: "Reminders"    },
];

// Tiny SVG push-pin for the logo
const PinIcon = () => (
  <svg width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden="true">
    <ellipse cx="8" cy="6.5" rx="6.5" ry="6.5" fill="#B23A2F" />
    <ellipse cx="8" cy="5.5" rx="3.5" ry="3.5" fill="rgba(255,255,255,0.18)" />
    <rect x="7" y="12" width="2" height="7" rx="1" fill="#8A7060" />
  </svg>
);

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location         = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <header
      style={{
        background: "var(--wall)",
        borderBottom: "1px solid rgba(31,28,23,0.13)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* ── Desktop nav — 3-column flex ── */}
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "0 1.5rem",
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        {/* Col 1: Logo (fixed width so center column is truly centered) */}
        <div style={{ flex: "0 0 140px", display: "flex", alignItems: "center" }}>
          <Link
            to="/"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}
          >
            <PinIcon />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "1.2rem",
                letterSpacing: "-0.02em",
                color: "var(--ink)",
              }}
            >
              HireIQ
            </span>
          </Link>
        </div>

        {/* Col 2: Nav links — centered, desktop only */}
        <nav
          className="hidden md:flex"
          style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: "0.25rem" }}
        >
          {NAV_LINKS.map(({ to, label }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.875rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--ink)" : "var(--grey)",
                  textDecoration: "none",
                  padding: "0.4rem 0.9rem",
                  position: "relative",
                  transition: "color 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: -1,
                      left: "0.9rem",
                      right: "0.9rem",
                      height: "2px",
                      background: "var(--string)",
                      borderRadius: "1px",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Col 3: User info + Logout — fixed width, right-aligned, desktop only */}
        <div
          className="hidden md:flex"
          style={{ flex: "0 0 140px", justifyContent: "flex-end", alignItems: "center", gap: "0.75rem" }}
        >
          <div style={{ textAlign: "right" }}>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", fontWeight: 600, color: "var(--ink)", margin: 0, lineHeight: 1.2 }}>
              {user.name || "User"}
            </p>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.68rem", color: "var(--grey)", margin: 0, lineHeight: 1.2, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.email}
            </p>
          </div>
          <button onClick={logout} title="Sign out" className="btn-icon btn-icon-danger" style={{ padding: "0.35rem", flexShrink: 0 }}>
            <LogOut size={15} />
          </button>
        </div>

        {/* Mobile hamburger — far right, only on small screens */}
        <button
          className="flex items-center md:hidden ml-auto"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink)", padding: "0.35rem" }}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ── Mobile dropdown menu ── */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            background: "var(--wall)",
            borderTop: "1px solid rgba(31,28,23,0.1)",
            padding: "0.5rem 1.5rem 1rem",
          }}
        >
          {NAV_LINKS.map(({ to, label }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "block",
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.9rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--ink)" : "var(--grey)",
                  textDecoration: "none",
                  padding: "0.55rem 0",
                  borderBottom: "1px solid rgba(31,28,23,0.07)",
                }}
              >
                {label}
              </Link>
            );
          })}

          {/* User + logout at bottom of mobile menu */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.75rem" }}>
            <div>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", fontWeight: 600, color: "var(--ink)", margin: 0 }}>
                {user.name || "User"}
              </p>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "var(--grey)", margin: 0 }}>
                {user.email}
              </p>
            </div>
            <button onClick={logout} className="btn-icon btn-icon-danger" style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
