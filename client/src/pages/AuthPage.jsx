// src/pages/AuthPage.jsx
//
// Glassmorphic Login / Register page with tab toggling and error handling.

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles, ArrowRight, Lock, Mail, User } from "lucide-react";

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  // ─── STEP 1: FORM SUBMISSION HANDLER ────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Step 1a: Check if isLogin is true
      if (isLogin) {
        // If true → call await login(email, password)
        await login(email, password);
      } else {
        // If false → call await register(name, email, password)
        await register(name, email, password);
      }
      // Step 1b: On success, navigate to home dashboard "/"
      navigate("/");

    } catch (err) {
      // Step 1c: Catch error and display backend message
      setError(err.response?.data?.error || "Authentication failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 shadow-xl shadow-brand-500/25 mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Welcome to HireIQ
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track applications, score resumes with AI, and land your dream role.
          </p>
        </div>

        {/* Glass Card */}
        <div className="glass-card p-8">
          {/* Tabs */}
          <div className="flex bg-slate-950/60 p-1 rounded-xl mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(""); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${isLogin ? "bg-brand-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(""); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${!isLogin ? "bg-brand-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
                }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Monu Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input pl-11"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input pl-11"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input pl-11"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              <span>{submitting ? "Processing..." : isLogin ? "Sign In" : "Create Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
