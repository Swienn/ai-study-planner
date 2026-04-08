"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function VerifyEmailPage() {
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      await supabase.auth.resend({ type: "signup", email: user.email });
    }
    setResent(true);
    setLoading(false);
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white">
      <div className="max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Verify your email</h1>
        <p className="text-slate-500 mb-6">
          Check your inbox and click the confirmation link to activate your account.
        </p>
        {resent ? (
          <p className="text-sm text-green-600 font-medium">Confirmation email resent.</p>
        ) : (
          <button
            onClick={handleResend}
            disabled={loading}
            className="text-sm text-indigo-600 font-medium hover:underline disabled:opacity-50"
          >
            {loading ? "Sending…" : "Resend confirmation email"}
          </button>
        )}
      </div>
    </main>
  );
}
