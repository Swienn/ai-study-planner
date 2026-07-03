"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

function Backdrop() {
  return (
    <>
      <div className="bg-brand-gradient-soft pointer-events-none absolute inset-0 -z-10" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(139,92,246,0.10),transparent)]" />
    </>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?type=recovery`,
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6">
      <Backdrop />
      <div className="mb-8 flex justify-center">
        <Logo size="lg" href="/" />
      </div>
      <Card className="w-full max-w-sm shadow-xl shadow-slate-200/50">
        <CardContent className="pt-6">
          {sent ? (
            <div className="text-center">
              <h1 className="mb-3 text-xl font-bold text-slate-900">Check your email</h1>
              <p className="text-slate-500">
                We sent a password reset link to <strong>{email}</strong>.
              </p>
            </div>
          ) : (
            <>
              <h1 className="mb-2 text-center text-xl font-bold text-slate-900">Reset your password</h1>
              <p className="mb-6 text-center text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={loading} className="bg-brand-gradient w-full border-0 hover:opacity-90">
                  {loading ? "Sending…" : "Send reset link"}
                </Button>
              </form>
              <p className="mt-4 text-center text-sm">
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Back to log in
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
