"use client";

import { useState } from "react";

type Topic = { id: string; title: string; summary: string; study_guide: string | null };

export default function ExamModeClient({
  planId,
  initialTopics,
}: {
  planId: string;
  initialTopics: Topic[];
}) {
  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missing = topics.filter((t) => !t.study_guide).length;

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/plans/${planId}/exam-mode`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
      } else if (Array.isArray(data.topics)) {
        setTopics(data.topics);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  if (topics.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-10">This plan has no topics yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {missing > 0 && (
        <div className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50">
          <p className="flex-1 text-sm text-slate-600">
            {missing === topics.length
              ? "Generate condensed revision notes for every topic."
              : `${missing} topic${missing === 1 ? "" : "s"} still need revision notes.`}
          </p>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            onClick={generate}
            disabled={loading}
            className="flex-shrink-0 text-sm px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate notes"}
          </button>
        </div>
      )}

      {topics.map((t) => (
        <div key={t.id} className="p-5 border border-slate-200 rounded-xl bg-white">
          <h2 className="text-base font-semibold text-slate-900 mb-2">{t.title}</h2>
          {t.study_guide ? (
            <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{t.study_guide}</div>
          ) : (
            <p className="text-sm text-slate-400 italic">{t.summary}</p>
          )}
        </div>
      ))}
    </div>
  );
}
