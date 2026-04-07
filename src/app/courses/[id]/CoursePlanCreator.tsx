"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ExistingPlan = {
  id: string;
  title: string;
  exam_date: string;
  hours_per_day: number;
} | null;

export default function CoursePlanCreator({
  courseId,
  courseTitle,
  existingPlan,
}: {
  courseId: string;
  courseTitle: string;
  existingPlan: ExistingPlan;
}) {
  const [mode, setMode] = useState<"idle" | "create" | "edit">("idle");
  const [title, setTitle] = useState(courseTitle);
  const [startDate, setStartDate] = useState("");
  const [examDate, setExamDate] = useState(existingPlan?.exam_date ?? "");
  const [hoursPerDay, setHoursPerDay] = useState(
    existingPlan ? String(existingPlan.hours_per_day) : "2"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const today = new Date().toISOString().split("T")[0];

  function openEdit() {
    setExamDate(existingPlan?.exam_date ?? "");
    setHoursPerDay(existingPlan ? String(existingPlan.hours_per_day) : "2");
    setStartDate("");
    setError(null);
    setMode("edit");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "edit" && existingPlan) {
      const res = await fetch(`/api/plans/${existingPlan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam_date: examDate,
          start_date: startDate || undefined,
          hours_per_day: parseFloat(hoursPerDay),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }
      setMode("idle");
      router.refresh();
    } else {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          title,
          start_date: startDate || undefined,
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
    setLoading(false);
  }

  // ── Existing plan ─────────────────────────────────────────────────────────
  if (existingPlan && mode === "idle") {
    return (
      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
        <div>
          <p className="text-sm font-medium text-slate-800">{existingPlan.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Exam{" "}
            {new Date(existingPlan.exam_date + "T00:00:00").toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {" · "}
            {existingPlan.hours_per_day}h / day
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openEdit}
            className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors"
          >
            Edit
          </button>
          <Link
            href={`/plans/${existingPlan.id}`}
            className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            View plan →
          </Link>
        </div>
      </div>
    );
  }

  // ── No plan yet ───────────────────────────────────────────────────────────
  if (!existingPlan && mode === "idle") {
    return (
      <button
        onClick={() => setMode("create")}
        className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
      >
        + Create study plan
      </button>
    );
  }

  // ── Create / Edit form ────────────────────────────────────────────────────
  const isEdit = mode === "edit";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50"
    >
      {!isEdit && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Plan title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>
      )}
      {isEdit && (
        <p className="text-sm font-medium text-slate-700">
          Regenerate plan — all progress will be reset.
        </p>
      )}
      <div className="flex gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-slate-600">
            Start date <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="date"
            min={today}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-slate-600">Exam date</label>
          <input
            type="date"
            required
            min={startDate || today}
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>
        <div className="flex flex-col gap-1 w-28">
          <label className="text-xs font-medium text-slate-600">Hours / day</label>
          <input
            type="number"
            required
            min="0.5"
            max="12"
            step="0.5"
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading
            ? isEdit
              ? "Regenerating…"
              : "Generating…"
            : isEdit
            ? "Regenerate plan"
            : "Generate plan"}
        </button>
        <button
          type="button"
          onClick={() => setMode("idle")}
          className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
