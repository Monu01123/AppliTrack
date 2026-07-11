// src/lib/api.js
//
// Axios API client configured for HireIQ backend.
// Automatically includes JWT Access Token and handles silent refresh via httpOnly cookie!

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // IMPORTANT: Allows sending & receiving httpOnly refresh token cookie
});

// Store accessToken in memory
let currentAccessToken = null;

export const setAccessToken = (token) => {
  currentAccessToken = token;
};

// Request Interceptor: Attach Authorization Bearer header if we have an access token
api.interceptors.request.use((config) => {
  if (currentAccessToken) {
    config.headers.Authorization = `Bearer ${currentAccessToken}`;
  }
  return config;
});

// Response Interceptor: If 401 Unauthorized occurs, try silent refresh once
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Don't retry refresh endpoint itself to avoid infinite loop
    if (originalRequest.url?.includes("/auth/refresh")) {
      currentAccessToken = null;
      localStorage.removeItem("hireiq_token");
      localStorage.removeItem("hireiq_user");
      window.dispatchEvent(new Event("auth:unauthorized"));
      if (typeof window !== "undefined" && window.location.pathname !== "/auth" && !window.location.pathname.startsWith("/p/")) {
        window.location.href = "/auth";
      }
      return Promise.reject(error);
    }

    // If error is 401 and we haven't already retried this exact request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(
          "http://localhost:5000/api/auth/refresh",
          {},
          { withCredentials: true }
        );
        currentAccessToken = data.accessToken;
        originalRequest.headers.Authorization = `Bearer ${currentAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        currentAccessToken = null;
        localStorage.removeItem("hireiq_token");
        localStorage.removeItem("hireiq_user");
        window.dispatchEvent(new Event("auth:unauthorized"));
        if (typeof window !== "undefined" && window.location.pathname !== "/auth" && !window.location.pathname.startsWith("/p/")) {
          window.location.href = "/auth";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
