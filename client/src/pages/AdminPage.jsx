import React, { useState, useEffect } from "react";
import axios from "axios";

export function AdminPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // In production, the backend might be on a different URL than the frontend
  const baseURL = import.meta.env.VITE_API_URL || "/api";

  useEffect(() => {
    // Hidden secret used to access the backend data
    axios.get(`${baseURL}/public/admin/users?secret=hireiq_admin_2026`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.error || err.message);
        setLoading(false);
      });
  }, [baseURL]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="cork-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-500/10 text-red-500 p-6 rounded-xl font-mono">
          [Admin Error]: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 mt-16 font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Secret Admin Dashboard</h1>
          <p className="text-gray-400">Total Users: <span className="text-emerald-400 font-mono font-bold">{data.totalUsers}</span></p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-gray-300 text-sm uppercase tracking-wider border-b border-white/10">
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Joined At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.users.map(user => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{user.name}</div>
                    <div className="text-xs text-gray-500 font-mono mt-1">{user.id}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{user.email}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(user.createdAt).toLocaleDateString(undefined, { 
                      year: 'numeric', month: 'short', day: 'numeric', 
                      hour: '2-digit', minute: '2-digit' 
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
