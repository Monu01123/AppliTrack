// src/App.jsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Create QueryClient instance with sensible default caching properties
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes fresh data
      refetchOnWindowFocus: false,
    },
  },
});

// Lazy load pages for automatic route-level code splitting
const AuthPage        = lazy(() => import("./pages/AuthPage").then((m)        => ({ default: m.AuthPage })));
const DashboardPage   = lazy(() => import("./pages/DashboardPage").then((m)   => ({ default: m.DashboardPage })));
const AnalyticsPage   = lazy(() => import("./pages/AnalyticsPage").then((m)   => ({ default: m.AnalyticsPage })));
const RemindersPage   = lazy(() => import("./pages/RemindersPage").then((m)   => ({ default: m.RemindersPage })));
const PublicProfilePage = lazy(() => import("./pages/PublicProfilePage").then((m) => ({ default: m.PublicProfilePage })));
const ApplicationsPage  = lazy(() => import("./pages/ApplicationsPage").then((m)  => ({ default: m.ApplicationsPage })));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="cork-spinner" />
  </div>
);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId="222026984237-3cjjgs9mtegcf8fjo2rlb5vfkqsmc7no.apps.googleusercontent.com">
        <AuthProvider>
          <BrowserRouter>
          <ErrorBoundary>
          {/* Top-nav layout: navbar stacks on top, content fills below */}
          <div className="min-h-screen flex flex-col" style={{ background: "var(--wall)" }}>
            <Navbar />
            <main className="flex-1 min-w-0">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/p/:slugOrId" element={<PublicProfilePage />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/applications"
                    element={
                      <ProtectedRoute>
                        <ApplicationsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute>
                        <AnalyticsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reminders"
                    element={
                      <ProtectedRoute>
                        <RemindersPage />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Suspense>
            </main>
          </div>
        </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
