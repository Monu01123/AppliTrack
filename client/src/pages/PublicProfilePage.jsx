import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Briefcase, Award, TrendingUp, Calendar, Tag, ShieldCheck, Sparkles, ExternalLink } from "lucide-react";

export const PublicProfilePage = () => {
  const { slugOrId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const STATUS_COLORS = {
    APPLIED:      "bg-sky-500/10 text-sky-400 border-sky-500/30",
    PHONE_SCREEN: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    OA_RECEIVED:  "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    INTERVIEW:    "bg-amber-500/10 text-amber-400 border-amber-500/30",
    OFFER:        "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    REJECTED:     "bg-rose-500/10 text-rose-400 border-rose-500/30",
    GHOSTED:      "bg-slate-500/10 text-slate-400 border-slate-500/30",
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");
        // Use the configured api client base URL or fallback
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const finalBaseUrl = apiUrl.endsWith("/api") ? apiUrl : `${apiUrl.replace(/\/$/, '')}/api`;
        
        const res = await fetch(`${finalBaseUrl}/public/profile/${slugOrId}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Profile not found.");
        }
        setProfileData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [slugOrId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white space-y-3">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading verified candidate showcase...</p>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white space-y-4">
        <div className="glass-card max-w-md w-full p-8 text-center space-y-4 border border-rose-500/30">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            🔒
          </div>
          <h2 className="text-xl font-bold text-white">Private or Unavailable</h2>
          <p className="text-slate-400 text-sm">
            {error || "This candidate has either disabled their public profile or the link is invalid."}
          </p>
          <Link
            to="/login"
            className="btn-primary inline-flex items-center justify-center gap-2 text-xs"
          >
            Go to HireIQ
          </Link>
        </div>
      </div>
    );
  }

  const { user, stats, applications } = profileData;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      {/* Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center font-black text-sm">
              HQ
            </span>
            <span className="font-bold text-white text-base tracking-tight">HireIQ Verified Showcase</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Public Stats
          </span>
        </div>
      </header>

      {/* Main Profile Showcase */}
      <main className="max-w-5xl mx-auto px-6 pt-10 space-y-8 animate-in fade-in duration-300">
        {/* Candidate Identity Card */}
        <div className="glass-card p-6 sm:p-8 bg-gradient-to-r from-sky-950/30 via-slate-900/80 to-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-white">{user.name}</h1>
              {user.profileSlug && (
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-sky-400 font-mono">
                  @{user.profileSlug}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <span>Active Job Search Portfolio</span>
              <span>•</span>
              <span>Member since {new Date(user.createdAt).toLocaleDateString()}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 flex items-center gap-1.5"
            >
              <span>Build Your Own Showcase</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Public Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-5 border-l-4 border-l-sky-500">
            <p className="text-xs uppercase font-semibold text-slate-400">Total Applications</p>
            <p className="text-3xl font-extrabold text-white mt-2">{stats.total}</p>
          </div>
          <div className="glass-card p-5 border-l-4 border-l-amber-500">
            <p className="text-xs uppercase font-semibold text-slate-400">Interview Conversions</p>
            <p className="text-3xl font-extrabold text-white mt-2">{stats.interviews}</p>
          </div>
          <div className="glass-card p-5 border-l-4 border-l-emerald-500">
            <p className="text-xs uppercase font-semibold text-slate-400">Offers Earned</p>
            <p className="text-3xl font-extrabold text-white mt-2">{stats.offers}</p>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Public Application Timeline</h3>
            <span className="text-xs text-slate-500">Showing non-confidential application history</span>
          </div>

          {applications.length === 0 ? (
            <div className="glass-card p-12 text-center text-slate-400">
              No public applications listed yet.
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="font-bold text-white text-base">{app.company}</h4>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg border text-xs font-semibold uppercase ${
                          STATUS_COLORS[app.status] || STATUS_COLORS.APPLIED
                        }`}
                      >
                        {app.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 font-medium">{app.role}</p>

                    {Array.isArray(app.tags) && app.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {app.tags.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60"
                          >
                            <Tag className="w-2.5 h-2.5 text-sky-400" />
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Applied {new Date(app.appliedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
