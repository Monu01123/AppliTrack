// src/context/AuthContext.jsx
//
// React Context that manages logged-in user state across the entire frontend app.
// Stores user session in localStorage + supports silent cookie refresh.

import React, { createContext, useContext, useState, useEffect } from "react";
import api, { setAccessToken } from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("hireiq_user");
    const savedToken = localStorage.getItem("hireiq_token");
    if (savedToken) {
      setAccessToken(savedToken);
    }
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.post("/auth/refresh");
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
        localStorage.setItem("hireiq_token", res.data.accessToken);
        localStorage.setItem("hireiq_user", JSON.stringify(res.data.user));
      } catch (err) {
        // If refresh fails but we already loaded user from localStorage above,
        // we can keep localStorage user if token is still valid, otherwise clear it.
        const savedToken = localStorage.getItem("hireiq_token");
        if (!savedToken) {
          setUser(null);
          localStorage.removeItem("hireiq_user");
          localStorage.removeItem("hireiq_token");
        }
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // ─── LOGIN FUNCTION ──────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    localStorage.setItem("hireiq_token", res.data.accessToken);
    localStorage.setItem("hireiq_user", JSON.stringify(res.data.user));
    return res.data;
  };

  // ─── REGISTER FUNCTION ───────────────────────────────────────────────────────
  const register = async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    localStorage.setItem("hireiq_token", res.data.accessToken);
    localStorage.setItem("hireiq_user", JSON.stringify(res.data.user));
    return res.data;
  };

  // ─── LOGOUT FUNCTION ─────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    }
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem("hireiq_token");
    localStorage.removeItem("hireiq_user");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
