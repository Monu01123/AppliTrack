// src/pages/AuthPage.jsx
//
// Login / Register page styled with the Rough White Elegance plaster theme.
// All text is dark (#2D2B2A) for readability on light background.

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles, ArrowRight, Lock, Mail, User, AlertCircle } from "lucide-react";

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
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center p-4"
      style={{
        backgroundImage: "radial-gradient(#EAE6DF 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FAF9F6] border border-[#EBE8E1] shadow-[0_4px_20px_rgba(0,0,0,0.06)] mb-5">
            <Sparkles className="w-7 h-7 text-[#9C8170]" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#2D2B2A] tracking-tight">
            Welcome to HireIQ
          </h1>
          <p className="text-[#6E6B6B] text-sm mt-1.5">
            Track applications, score resumes with AI, and land your dream role.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#FAF9F6] border border-[#EBE8E1] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-8">

          {/* Tab Toggle */}
          <div className="flex bg-[#F3F1EC] p-1 rounded-xl mb-6 border border-[#E5E1D8]">
            <button
              type="button"
              onClick={() => switchMode(true)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                isLogin
                  ? "bg-[#FAF9F6] text-[#2D2B2A] shadow-sm border border-[#EBE8E1]"
                  : "text-[#6E6B6B] hover:text-[#2D2B2A]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode(false)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                !isLogin
                  ? "bg-[#FAF9F6] text-[#2D2B2A] shadow-sm border border-[#EBE8E1]"
                  : "text-[#6E6B6B] hover:text-[#2D2B2A]"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#FDF2F0] border border-[#E8B8B0] text-[#BA6856] text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name — only on register */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-[#2D2B2A] uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#9C8170] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#2D2B2A] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9C8170] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-[#2D2B2A] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#9C8170] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-1 py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{submitting ? "Processing…" : isLogin ? "Sign In" : "Create Account"}</span>
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Switch Mode Footer */}
          <p className="text-center text-xs text-[#6E6B6B] mt-5">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(!isLogin)}
              className="text-[#9C8170] font-semibold hover:text-[#7A6358] hover:underline transition-colors"
            >
              {isLogin ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-[#B5A397] mt-6">
          Your data is private and never shared.
        </p>
      </div>
    </div>
  );
};
