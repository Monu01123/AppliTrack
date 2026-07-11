// src/pages/AuthPage.jsx
//
// Sign In / Create Account — pinned index card on plaster wall background.
// All logic, fields, and validation unchanged.

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowRight, Mail, Lock, User, AlertCircle } from "lucide-react";

// Tiny SVG pin logo for the auth card header
const PinLogo = () => (
  <svg width="22" height="26" viewBox="0 0 22 26" fill="none" aria-hidden="true">
    <ellipse cx="11" cy="9" rx="9" ry="9" fill="#B23A2F" />
    <ellipse cx="11" cy="8" rx="5" ry="5" fill="rgba(255,255,255,0.2)" />
    <rect x="10" y="17" width="2.5" height="9" rx="1.25" fill="#8A7060" />
  </svg>
);

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Authentication failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (toLogin) => {
    setIsLogin(toLogin);
    setError("");
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "var(--wall)" }}
    >
      {/* Brand mark above card */}
      <div className="flex items-center gap-2.5 mb-8">
        <PinLogo />
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: "1.6rem",
            color: "var(--ink)",
            letterSpacing: "-0.02em",
          }}
        >
          HireIQ
        </span>
      </div>

      {/* Pinned index card — no rotation on auth */}
      <div
        className="cork-card-flat w-full"
        style={{ maxWidth: 420 }}
      >
        {/* Heading */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--ink)",
            marginBottom: "0.25rem",
            textAlign: "center",
          }}
        >
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "0.8rem",
            color: "var(--grey)",
            textAlign: "center",
            marginBottom: "1.5rem",
          }}
        >
          Track applications, score resumes with AI, and land your dream role.
        </p>

        {/* Tab toggle */}
        <div
          style={{
            display: "flex",
            background: "var(--wall-2)",
            borderRadius: "2px",
            padding: "3px",
            marginBottom: "1.25rem",
            border: "1px solid rgba(31,28,23,0.12)",
          }}
        >
          {[
            { label: "Sign In", toLogin: true },
            { label: "Create Account", toLogin: false },
          ].map(({ label, toLogin }) => (
            <button
              key={label}
              type="button"
              onClick={() => switchMode(toLogin)}
              style={{
                flex: 1,
                padding: "0.5rem",
                fontSize: "0.8125rem",
                fontFamily: "var(--font-ui)",
                fontWeight: isLogin === toLogin ? 600 : 400,
                color: isLogin === toLogin ? "var(--ink)" : "var(--grey)",
                background: isLogin === toLogin ? "var(--card)" : "transparent",
                border: "none",
                borderRadius: "1px",
                boxShadow: isLogin === toLogin ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Error alert */}
        {error && (
          <div
            style={{
              background: "rgba(178,58,47,0.08)",
              border: "1px solid rgba(178,58,47,0.3)",
              borderRadius: "2px",
              padding: "0.65rem 0.875rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.5rem",
              color: "var(--string)",
              fontSize: "0.8rem",
              fontFamily: "var(--font-ui)",
            }}
          >
            <AlertCircle size={15} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Name — register only */}
          {!isLogin && (
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--grey)",
                  marginBottom: "0.4rem",
                }}
              >
                Full Name
              </label>
              <div style={{ position: "relative" }}>
                <User
                  size={15}
                  style={{
                    position: "absolute",
                    left: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--grey)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="cork-input"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-ui)",
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--grey)",
                marginBottom: "0.4rem",
              }}
            >
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={15}
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--grey)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="cork-input"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-ui)",
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--grey)",
                marginBottom: "0.4rem",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={15}
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--grey)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="cork-input"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-cork"
            style={{ width: "100%", justifyContent: "center", marginTop: "0.25rem", padding: "0.75rem" }}
          >
            <span>{submitting ? "Processing…" : isLogin ? "Sign In" : "Create Account"}</span>
            {!submitting && <ArrowRight size={15} />}
          </button>
        </form>

        {/* Switch mode */}
        <p
          style={{
            textAlign: "center",
            fontSize: "0.78rem",
            color: "var(--grey)",
            fontFamily: "var(--font-ui)",
            marginTop: "1.25rem",
          }}
        >
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => switchMode(!isLogin)}
            className="btn-string"
            style={{ fontSize: "0.78rem" }}
          >
            {isLogin ? "Create one" : "Sign in"}
          </button>
        </p>

        {/* Small handwritten annotation */}
        <p
          style={{
            textAlign: "center",
            fontFamily: "var(--font-hand)",
            fontSize: "0.85rem",
            color: "var(--grey)",
            marginTop: "0.5rem",
            opacity: 0.6,
          }}
        >
          your job search, organized ✓
        </p>
      </div>

      <p
        style={{
          marginTop: "1.5rem",
          fontSize: "0.7rem",
          color: "var(--grey)",
          fontFamily: "var(--font-ui)",
          opacity: 0.65,
        }}
      >
        Your data is private and never shared.
      </p>
    </div>
  );
};
