// src/lib/api.js
//
// Axios API client configured for HireIQ backend.
// Automatically includes JWT Access Token from localStorage and handles silent refresh!

import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

// Store accessToken in memory & load from localStorage on boot
let currentAccessToken = localStorage.getItem("hireiq_token");
if (currentAccessToken === "undefined" || currentAccessToken === "null") {
  currentAccessToken = null;
}

export const setAccessToken = (token) => {
  currentAccessToken = token;
  if (token) {
    localStorage.setItem("hireiq_token", token);
  } else {
    localStorage.removeItem("hireiq_token");
  }
};

// Request Interceptor: Attach Authorization Bearer header if we have an access token
api.interceptors.request.use((config) => {
  const token = currentAccessToken || localStorage.getItem("hireiq_token");
  if (token && token !== "undefined" && token !== "null") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: If 401 Unauthorized occurs, try silent refresh once
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(
          "http://localhost:5000/api/auth/refresh",
          {},
          { withCredentials: true }
        );
        setAccessToken(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
