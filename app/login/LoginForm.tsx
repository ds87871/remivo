"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(data.message || "Wrong username or password");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center mb-4">
          <img src="/logo-mark.svg" alt="Remivo Logo" className="w-12 h-12 drop-shadow-lg" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
        <p className="text-slate-400 text-sm mt-1">Sign in to access your Remivo dashboard</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <div>
          <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl text-white outline-none transition-all placeholder:text-slate-600"
            placeholder="Enter username"
          />
        </div>

        <div>
          <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl text-white outline-none transition-all placeholder:text-slate-600"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center shadow-lg shadow-indigo-600/20"
        >
          {loading ? (
            <img src="/logo-mark.svg" alt="Loading" className="animate-pulse h-6 w-auto" />
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </div>
  );
}
