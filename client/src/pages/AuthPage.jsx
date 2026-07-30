// src/pages/AuthPage.jsx
//
// Editorial Corkboard Desk — Award-Winning Sign In & Create Account Showcase.
// All authentication logic, form fields, state, and validation 100% unchanged.

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { ArrowRight, Mail, Lock, User, AlertCircle, Sparkles, CheckCircle2, Briefcase } from "lucide-react";

// Tiny SVG push-pin icon
const PushPin = ({ color = "#B23A2F" }) => (
  <svg width="20" height="24" viewBox="0 0 20 24" fill="none" aria-hidden="true">
    <ellipse cx="10" cy="8" rx="8" ry="8" fill={color} />
    <ellipse cx="10" cy="7" rx="4.5" ry="4.5" fill="rgba(255,255,255,0.25)" />
    <rect x="9" y="15" width="2" height="8" rx="1" fill="#8A7060" />
  </svg>
);

export const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setSuccessMsg("Email verified! You can now log in.");
      setIsLogin(true);
    }
  }, [searchParams]);

  const [errorCode, setErrorCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [resendStatus, setResendStatus] = useState("");

  const { user, login, googleLogin, register } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect them to the dashboard!
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setErrorCode("");
    setResendStatus("");
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
        navigate("/");
      } else {
        await register(name, email, password);
        setRegistrationSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Authentication failed. Please try again.");
      setErrorCode(err.response?.data?.code || "");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setSubmitting(true);
    try {
      await googleLogin(credentialResponse.credential);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Google Authentication failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setResendStatus("Sending...");
      await api.post("/auth/resend-verification", { email });
      setResendStatus("Email sent!");
    } catch (err) {
      setResendStatus(err.response?.data?.error || "Failed to resend.");
    }
  };

  const switchMode = (toLogin) => {
    setIsLogin(toLogin);
    setError("");
    setErrorCode("");
    setResendStatus("");
    setRegistrationSuccess(false);
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-10"
      style={{ background: "var(--wall)" }}
    >
      {/* ── 2-Column Editorial Desk Container ── */}
      <div
        style={{
          maxWidth: 1060,
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "3rem",
          alignItems: "center",
        }}
      >
        {/* ── Left Column: Editorial Corkboard Showcase ── */}
        <div style={{ paddingRight: "0.5rem" }}>
          {/* Brand mark */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
            <PushPin color="#B23A2F" />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: "1.8rem",
                color: "var(--ink)",
                letterSpacing: "-0.03em",
              }}
            >
              HireIQ
            </span>
            <span className="tape-label" style={{ marginLeft: "0.4rem", fontSize: "0.58rem" }}>
              AI JOB DESK
            </span>
          </div>

          {/* Hero Headline */}
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2.5rem",
              fontWeight: 800,
              lineHeight: 1.15,
              color: "var(--ink)",
              marginBottom: "1rem",
              letterSpacing: "-0.02em",
            }}
          >
            Your career search, pinned & conquered.
          </h1>

          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.95rem",
              color: "var(--grey)",
              lineHeight: 1.6,
              marginBottom: "2rem",
              maxWidth: 440,
            }}
          >
            Replace messy spreadsheets with a tactile, AI-powered corkboard tracker. Score resume alignment, set follow-up reminders, and land multiple offers.
          </p>

          {/* Mini Physical Desk Preview Scene */}
          <div style={{ position: "relative", marginBottom: "2rem", maxWidth: 420 }}>
            {/* Card 1: Sample application pinned */}
            <div
              className="cork-card cork-card-r1"
              style={{
                padding: "1.1rem 1.25rem",
                marginBottom: "-0.75rem",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)" }}>
                    Google · Staff Software Engineer
                  </div>
                  <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", color: "var(--grey)" }}>
                    Mountain View, CA · $280k–$320k
                  </div>
                </div>
                <span className="stamp stamp-offer" style={{ fontSize: "0.55rem" }}>
                  INTERVIEW INVITE
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.6rem" }}>
                <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.65rem", padding: "1px 6px", background: "var(--tape)", borderRadius: 1 }}>
                  #Referral
                </span>
                <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.65rem", padding: "1px 6px", background: "rgba(47,75,124,0.12)", color: "var(--stamp-blue)", borderRadius: 1, fontWeight: 600 }}>
                  ✨ AI Match: 94%
                </span>
              </div>
            </div>

            {/* Card 2: Underlying card */}
            <div
              className="cork-card cork-card-r4"
              style={{
                padding: "1.1rem 1.25rem",
                marginLeft: "1.5rem",
                position: "relative",
                zIndex: 1,
                opacity: 0.92,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "var(--ink)" }}>
                  Stripe · Frontend Specialist
                </div>
                <span className="stamp stamp-applied" style={{ fontSize: "0.55rem" }}>
                  APPLIED
                </span>
              </div>
            </div>
          </div>

          {/* Handwritten testimonial note */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.25rem" }}>📌</span>
            <p
              style={{
                fontFamily: "var(--font-hand)",
                fontSize: "1.05rem",
                color: "var(--grey)",
                margin: 0,
              }}
            >
              “Organized 42 applications & landed 3 offers in one place!” — monu
            </p>
          </div>
        </div>

        {/* ── Right Column: Pinned Auth Interactive Card ── */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            className={`cork-card w-full ${isLogin ? "cork-card-r2" : "cork-card-r3"}`}
            style={{
              maxWidth: 430,
              padding: "2rem 1.75rem",
              background: isLogin ? "var(--card)" : "#FFFDF8",
              border: isLogin
                ? "1px solid rgba(31,28,23,0.14)"
                : "2px solid rgba(178,58,47,0.35)",
              boxShadow: isLogin
                ? "0 14px 34px rgba(0,0,0,0.16)"
                : "0 18px 42px rgba(178,58,47,0.12), 0 6px 14px rgba(0,0,0,0.14)",
            }}
          >
            {/* Distinct Header per mode */}
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              {isLogin ? (
                <>
                  <span className="stamp stamp-applied" style={{ marginBottom: "0.6rem", display: "inline-block" }}>
                    ACCOUNT ACCESS
                  </span>
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.65rem",
                      fontWeight: 700,
                      color: "var(--ink)",
                      margin: "0.2rem 0 0.25rem",
                    }}
                  >
                    Welcome back to the board
                  </h2>
                  <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "var(--grey)" }}>
                    Sign in to track pipeline velocity and review interview alerts.
                  </p>
                </>
              ) : (
                <>
                  <span className="stamp stamp-pending" style={{ marginBottom: "0.6rem", display: "inline-block" }}>
                    NEW WORKSPACE
                  </span>
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.65rem",
                      fontWeight: 700,
                      color: "var(--ink)",
                      margin: "0.2rem 0 0.25rem",
                    }}
                  >
                    Claim your personal board
                  </h2>
                  <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "var(--grey)" }}>
                    Free forever · No credit card required · Instant setup
                  </p>
                </>
              )}
            </div>

            {/* Mode Switcher Tabs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                background: "var(--wall-2)",
                padding: "3px",
                borderRadius: "2px",
                marginBottom: "1.5rem",
                border: "1px solid rgba(31,28,23,0.15)",
              }}
            >
              {[
                { label: "Sign In", active: isLogin, mode: true },
                { label: "Create Account", active: !isLogin, mode: false },
              ].map(({ label, active, mode }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => switchMode(mode)}
                  style={{
                    padding: "0.55rem",
                    fontFamily: "var(--font-ui)",
                    fontSize: "0.8125rem",
                    fontWeight: active ? 600 : 400,
                    color: active ? "var(--ink)" : "var(--grey)",
                    background: active ? "var(--card)" : "transparent",
                    border: "none",
                    borderRadius: "1px",
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Success Toast */}
            {successMsg && (
              <div
                style={{
                  background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.35)",
                  borderRadius: 2,
                  padding: "0.65rem 0.85rem",
                  marginBottom: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "#15803d",
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.8rem",
                }}
              >
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div
                style={{
                  background: "rgba(178,58,47,0.08)",
                  border: "1px solid rgba(178,58,47,0.35)",
                  borderRadius: 2,
                  padding: "0.65rem 0.85rem",
                  marginBottom: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "var(--string)",
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.8rem",
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <span>{error}</span>
                  {errorCode === "EMAIL_NOT_VERIFIED" && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendStatus === "Sending..."}
                      style={{
                        alignSelf: "flex-start",
                        background: "var(--string)",
                        color: "white",
                        border: "none",
                        padding: "4px 8px",
                        fontSize: "0.7rem",
                        borderRadius: "2px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {resendStatus || "Resend Verification Email"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Registration Success Message */}
            {registrationSuccess ? (
              <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                <Mail size={48} color="var(--string)" style={{ margin: "0 auto 1rem", opacity: 0.8 }} />
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--ink)", marginBottom: "0.5rem" }}>
                  Check your inbox!
                </h3>
                <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem", color: "var(--grey)", marginBottom: "1.5rem" }}>
                  We've sent a verification link to <strong>{email}</strong>. Please click the link to activate your account.
                </p>
                <button
                  type="button"
                  onClick={() => switchMode(true)}
                  style={{
                    background: "var(--ink)",
                    color: "#fff",
                    border: "none",
                    padding: "0.6rem 1.25rem",
                    fontFamily: "var(--font-ui)",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    boxShadow: "3px 3px 0 rgba(0,0,0,0.15)",
                  }}
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                {/* Google Sign-In Button */}
                <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "center" }}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError("Google Sign-In was unsuccessful or closed.")}
                    useOneTap
                    theme="outline"
                    size="large"
                    text={isLogin ? "signin_with" : "signup_with"}
                    shape="rectangular"
                    width="100%"
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                  <hr style={{ flex: 1, borderTop: "1px solid rgba(31,28,23,0.15)" }} />
                  <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", color: "var(--grey)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Or continue with email</span>
                  <hr style={{ flex: 1, borderTop: "1px solid rgba(31,28,23,0.15)" }} />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                {/* Full Name — Signup Only */}
                {!isLogin && (
                  <div>
                  <label
                    style={{
                      display: "block",
                      fontFamily: "var(--font-ui)",
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--grey)",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Your Full Name
                  </label>
                  <div style={{ position: "relative" }}>
                    <User
                      size={15}
                      style={{
                        position: "absolute",
                        left: "0.85rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--grey)",
                        pointerEvents: "none",
                      }}
                    />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Rivera"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="cork-input"
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-ui)",
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--grey)",
                    marginBottom: "0.35rem",
                  }}
                >
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={15}
                    style={{
                      position: "absolute",
                      left: "0.85rem",
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
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--grey)",
                    marginBottom: "0.35rem",
                  }}
                >
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={15}
                    style={{
                      position: "absolute",
                      left: "0.85rem",
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="btn-cork"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "0.75rem",
                  marginTop: "0.4rem",
                  fontSize: "0.875rem",
                  background: isLogin ? "var(--ink)" : "var(--string)",
                }}
              >
                <span>{submitting ? "Processing…" : isLogin ? "Sign In to Workspace" : "Create My Workspace"}</span>
                {!submitting && <ArrowRight size={16} />}
              </button>
            </form>

            {/* Toggle footer link */}
            <div
              style={{
                textAlign: "center",
                marginTop: "1.35rem",
                paddingTop: "1.1rem",
                borderTop: "1px dashed rgba(31,28,23,0.15)",
              }}
            >
              <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "var(--grey)" }}>
                {isLogin ? "New to HireIQ?" : "Already have a workspace?"}{" "}
              </span>
              <button
                type="button"
                onClick={() => switchMode(!isLogin)}
                className="btn-string"
                style={{ fontSize: "0.78rem", fontWeight: 600 }}
              >
                {isLogin ? "Create account" : "Sign in here"}
              </button>
            </div>
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
