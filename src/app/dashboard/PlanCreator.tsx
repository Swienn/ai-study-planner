"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Document = {
  id: string;
  filename: string;
  topic_count: number;
};

export default function PlanCreator({ document: doc }: { document: Document }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(doc.filename.replace(/\.pdf$/i, ""));
  const [examDate, setExamDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("2");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document_id: doc.id,
        title,
        exam_date: examDate,
        hours_per_day: parseFloat(hoursPerDay),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    router.push(`/plans/${data.plan.id}`);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        Create plan
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 flex flex-col gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Plan title</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-gray-600">Exam date</label>
          <input
            type="date"
            required
            min={today}
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
          />
        </div>
        <div className="flex flex-col gap-1 w-28">
          <label className="text-xs font-medium text-gray-600">Hours / day</label>
          <input
            type="number"
            required
            min="0.5"
            max="12"
            step="0.5"
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-black text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? "Generating plan…" : "Generate plan"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
