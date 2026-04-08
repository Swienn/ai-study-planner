"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
