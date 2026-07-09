// src/context/AuthContext.jsx
//
// React Context that manages logged-in user state across the entire frontend app.
// Provides login, register, and logout functions to all child components.

import React, { createContext, useContext, useState, useEffect } from "react";
import api, { setAccessToken } from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On initial page load, check if we already have an active session via silent refresh
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.post("/auth/refresh");
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
      } catch (err) {
        // No valid refresh token found — stay logged out
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // ─── STEP 1: LOGIN FUNCTION ──────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data;
  };

  // ─── STEP 2: REGISTER FUNCTION ───────────────────────────────────────────────
  const register = async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data;
  };

  // ─── STEP 3: LOGOUT FUNCTION ─────────────────────────────────────────────────
  const logout = async () => {
    await api.post("/auth/logout");
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
