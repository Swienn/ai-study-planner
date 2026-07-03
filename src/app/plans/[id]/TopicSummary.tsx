"use client";

import { useEffect, useState } from "react";
import Markdown from "@/components/Markdown";

export default function TopicSummary({ topicId }: { topicId: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/topics/${topicId}/summary`)
      .then((r) => (r.ok ? r.json() : { summary: null }))
      .then((data) => active && setSummary(data.summary ?? null))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [topicId]);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/topics/${topicId}/summary`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Something went wrong");
      else setSummary(data.summary ?? null);
    } catch {
      setError("Network error — please try again");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return <div className="mt-2 p-4 text-sm text-slate-400 text-center">Loading…</div>;
  }

  if (!summary) {
    return (
      <div className="mt-2 border border-slate-200 rounded-xl bg-slate-50 p-4 text-center">
        <p className="text-sm text-slate-500 mb-3">
          Get a focused study summary to help you learn this topic.
        </p>
        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
        <button
          onClick={generate}
          disabled={generating}
          className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate summary"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 border border-slate-200 rounded-xl bg-white p-4 text-slate-700">
      <Markdown>{summary}</Markdown>
    </div>
  );
}
