"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="bg-brand-gradient-soft pointer-events-none absolute inset-0 -z-10" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(139,92,246,0.10),transparent)]" />
      <div className="mb-8 flex justify-center">
        <Logo size="lg" href="/" />
      </div>
      <Card className="w-full max-w-sm shadow-xl shadow-slate-200/50">
        <CardContent className="pt-6">
          <h1 className="mb-3 text-xl font-bold text-slate-900">Verify your email</h1>
          <p className="mb-6 text-slate-500">
            Check your inbox and click the confirmation link to activate your account.
          </p>
          {resent ? (
            <p className="text-sm font-medium text-green-600">Confirmation email resent.</p>
          ) : (
            <Button variant="outline" onClick={handleResend} disabled={loading} className="w-full">
              {loading ? "Sending…" : "Resend confirmation email"}
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
