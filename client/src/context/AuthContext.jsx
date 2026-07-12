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
    if (savedToken && savedToken !== "undefined" && savedToken !== "null") {
      setAccessToken(savedToken);
    }
    if (!savedUser || savedUser === "undefined" || savedUser === "null") {
      return null;
    }
    try {
      return JSON.parse(savedUser);
    } catch (e) {
      localStorage.removeItem("hireiq_user");
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem("hireiq_user");
      localStorage.removeItem("hireiq_token");
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);

    const checkAuth = async () => {
      try {
        const res = await api.post("/auth/refresh");
        if (res.data?.accessToken && res.data?.user) {
          setAccessToken(res.data.accessToken);
          setUser(res.data.user);
          localStorage.setItem("hireiq_token", res.data.accessToken);
          localStorage.setItem("hireiq_user", JSON.stringify(res.data.user));
        }
      } catch (err) {
        // If refresh fails with 401 Unauthorized (session expired or revoked)
        // or if there is no savedToken, clear user state and localStorage
        if (err.response?.status === 401 || !localStorage.getItem("hireiq_token")) {
          handleUnauthorized();
        }
      } finally {
        setLoading(false);
      }
    };
    checkAuth();

    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
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
    // Do NOT automatically log in or save tokens. Wait for email verification.
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
