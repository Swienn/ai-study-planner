"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type NotifPrefs = { daily_reminder: boolean; exam_countdown: boolean };

export function NotificationPreferences({ initial }: { initial: NotifPrefs }) {
  const [prefs, setPrefs] = useState<NotifPrefs>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function update(next: NotifPrefs) {
    const prev = prefs;
    setPrefs(next);
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/account/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) {
        setPrefs(prev); // roll back on failure
        setError("Couldn't save — try again");
      } else {
        setSaved(true);
      }
    } catch {
      setPrefs(prev);
      setError("Network error — try again");
    } finally {
      setSaving(false);
    }
  }

  const rows: { key: keyof NotifPrefs; label: string; hint: string }[] = [
    { key: "daily_reminder", label: "Daily study reminder", hint: "A morning email listing today's topics" },
    { key: "exam_countdown", label: "Exam countdown", hint: "A heads-up 3 days before each exam" },
  ];

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <label key={row.key} className="flex items-start justify-between gap-3 cursor-pointer">
          <span className="flex flex-col">
            <span className="text-sm text-slate-700">{row.label}</span>
            <span className="text-xs text-slate-400">{row.hint}</span>
          </span>
          <input
            type="checkbox"
            checked={prefs[row.key]}
            disabled={saving}
            onChange={(e) => update({ ...prefs, [row.key]: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-indigo-600 shrink-0"
          />
        </label>
      ))}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {saved && !error && <p className="text-xs text-green-600">Saved.</p>}
    </div>
  );
}

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const next = email.trim();
    if (!next) { setError("Enter a new email address"); return; }
    if (next === currentEmail) { setError("That's already your email"); return; }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: next });
    setLoading(false);

    if (error) { setError(error.message); return; }
    setSuccess(true);
    setEmail("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label className="text-sm text-slate-700">Change email</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="new@email.com"
        className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
      />
      <button
        type="submit"
        disabled={loading}
        className="self-start px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        {loading ? "Saving…" : "Update email"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {success && (
        <p className="text-xs text-green-600">
          Confirmation sent — check your new inbox to finish the change.
        </p>
      )}
    </form>
  );
}

export function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords don't match"); return; }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) { setError(error.message); return; }
    setSuccess(true);
    setPassword("");
    setConfirm("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label className="text-sm text-slate-700">Change password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        autoComplete="new-password"
        className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm new password"
        autoComplete="new-password"
        className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
      />
      <button
        type="submit"
        disabled={loading}
        className="self-start px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        {loading ? "Saving…" : "Update password"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {success && <p className="text-xs text-green-600">Password updated.</p>}
    </form>
  );
}

export function UpgradeButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); setLoading(false); return; }
      window.location.href = data.url;
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {loading ? "Redirecting…" : "Upgrade to Premium — €8 / month"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleManage() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); setLoading(false); return; }
      window.location.href = data.url;
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleManage}
        disabled={loading}
        className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        {loading ? "Opening portal…" : "Manage subscription"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function ExportDataButton() {
  const [loading, setLoading] = useState(false);

  function handleExport() {
    setLoading(true);
    // Trigger download via anchor — browser handles the Content-Disposition header
    const a = document.createElement("a");
    a.href = "/api/account/export";
    a.click();
    setTimeout(() => setLoading(false), 1500);
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="text-sm text-slate-600 hover:text-slate-900 underline underline-offset-2 transition-colors disabled:opacity-50"
    >
      {loading ? "Preparing export…" : "Export my data (JSON)"}
    </button>
  );
}

export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); setLoading(false); return; }
      router.push("/");
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-sm text-red-500 hover:text-red-700 underline underline-offset-2 transition-colors"
      >
        Delete my account
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
      <p className="text-sm font-medium text-red-800">
        This permanently deletes all your courses, plans, and uploaded files. This cannot be undone.
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Deleting…" : "Yes, delete everything"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
