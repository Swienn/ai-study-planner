"use client";

import { useEffect } from "react";

// Page-level error boundary — catches render/runtime errors within the app
// layout, reports them to /api/errors, and offers a retry.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        url: typeof window !== "undefined" ? window.location.href : null,
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white">
      <div className="max-w-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Something went wrong</h1>
        <p className="text-slate-500 mb-6">
          An unexpected error occurred. It has been logged — please try again.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
