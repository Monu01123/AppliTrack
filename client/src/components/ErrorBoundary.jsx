// src/components/ErrorBoundary.jsx
//
// React Error Boundary that catches rendering errors in child components
// and displays a graceful recovery screen instead of crashing the app to a white screen.

import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught React UI error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
          <div className="glass-card max-w-md p-8 space-y-4 border border-rose-500/30">
            <h2 className="text-xl font-bold text-rose-400">Something went wrong</h2>
            <p className="text-sm text-slate-400">
              An unexpected error occurred in the interface.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
