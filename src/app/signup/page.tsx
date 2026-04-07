"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  const logo = (
    <div className="flex justify-center mb-6">
      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      </div>
    </div>
  );

  if (success) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white">
        <div className="max-w-sm">
          {logo}
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Check your email</h1>
          <p className="text-slate-500">
            We sent a confirmation link to <strong>{email}</strong>. Click it to
            activate your account.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-white">
      <div className="w-full max-w-sm">
        {logo}
        <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">Create an account</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 mt-1"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-4 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-600 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
