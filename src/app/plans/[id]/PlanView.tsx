"use client";

import { useState } from "react";
import Link from "next/link";

type Status = "pending" | "completed" | "skipped";

type Topic = {
  id: string;
  title: string;
  summary: string;
  difficulty: 1 | 2 | 3;
  document_id: string | null;
};

type PlanItem = {
  id: string;
  date: string;
  status: Status;
  topics: Topic;
};

type Document = {
  id: string;
  filename: string;
};

const difficultyLabel = { 1: "Easy", 2: "Medium", 3: "Hard" } as const;
const difficultyColor = {
  1: "bg-green-100 text-green-700",
  2: "bg-yellow-100 text-yellow-700",
  3: "bg-red-100 text-red-700",
} as const;

const statusIcon: Record<Status, string> = {
  pending: "○",
  completed: "✓",
  skipped: "–",
};

const statusStyle: Record<Status, string> = {
  pending: "border-slate-300 text-slate-400",
  completed: "border-green-500 bg-green-500 text-white",
  skipped: "border-slate-300 bg-slate-100 text-slate-400",
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function isToday(dateStr: string) {
  return new Date().toISOString().split("T")[0] === dateStr;
}

function isPast(dateStr: string) {
  return dateStr < new Date().toISOString().split("T")[0];
}

function TopicCard({
  item,
  onToggle,
}: {
  item: PlanItem;
  onToggle: (item: PlanItem) => void;
}) {
  return (
    <button
      onClick={() => onToggle(item)}
      className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all hover:shadow-sm w-full ${
        item.status === "skipped"
          ? "border-slate-200 opacity-50 bg-white"
          : item.status === "completed"
          ? "border-green-200 bg-green-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <span
        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold ${statusStyle[item.status]}`}
      >
        {statusIcon[item.status]}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-sm font-medium ${
              item.status === "completed"
                ? "line-through text-slate-400"
                : "text-slate-800"
            }`}
          >
            {item.topics.title}
          </span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full ${difficultyColor[item.topics.difficulty]}`}
          >
            {difficultyLabel[item.topics.difficulty]}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
          {item.topics.summary}
        </p>
      </div>
    </button>
  );
}

export default function PlanView({
  initialItems,
  examDate,
  documents,
  initialDate,
  planId,
}: {
  initialItems: PlanItem[];
  examDate: string;
  documents: Document[];
  initialDate: string | null;
  planId: string;
}) {
  const [items, setItems] = useState<PlanItem[]>(initialItems);
  const [activeTab, setActiveTab] = useState<string>("all");

  async function toggleStatus(item: PlanItem) {
    const next: Status =
      item.status === "pending"
        ? "completed"
        : item.status === "completed"
        ? "skipped"
        : "pending";

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: next } : i))
    );

    const res = await fetch(`/api/plan-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    if (!res.ok) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: item.status } : i))
      );
    }
  }

  // ── DAY VIEW (when navigated from sidebar/calendar with a date) ──────────
  if (initialDate) {
    const dayItems = items.filter((i) => i.date === initialDate);

    // Documents that have topics on this day
    const docIdsOnDay = new Set(
      dayItems.map((i) => i.topics.document_id).filter(Boolean)
    );
    const dayDocs = documents.filter((d) => docIdsOnDay.has(d.id));

    // Filter by selected tab
    const filteredItems =
      activeTab === "all"
        ? dayItems
        : dayItems.filter((i) => i.topics.document_id === activeTab);

    const total = filteredItems.length;
    const completed = filteredItems.filter(
      (i) => i.status === "completed"
    ).length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    const allTotal = dayItems.length;
    const allCompleted = dayItems.filter((i) => i.status === "completed").length;

    return (
      <div>
        {/* Date header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold text-slate-800">
              {formatDate(initialDate)}
            </h2>
            {isToday(initialDate) && (
              <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium">
                Today
              </span>
            )}
          </div>
          <Link
            href={`/plans/${planId}`}
            className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
          >
            View full plan →
          </Link>
        </div>

        {/* PDF tabs */}
        {dayDocs.length > 0 && (
          <div className="flex gap-1 mb-5 p-1 bg-slate-100 rounded-xl w-fit max-w-full overflow-x-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              All
              <span className="ml-1.5 text-xs text-slate-400">
                {allCompleted}/{allTotal}
              </span>
            </button>
            {dayDocs.map((doc) => {
              const docItems = dayItems.filter(
                (i) => i.topics.document_id === doc.id
              );
              const docDone = docItems.filter(
                (i) => i.status === "completed"
              ).length;
              const shortName = doc.filename
                .replace(/\.pdf$/i, "")
                .slice(0, 22);
              return (
                <button
                  key={doc.id}
                  onClick={() => setActiveTab(doc.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === doc.id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {shortName}
                  <span className="ml-1.5 text-xs text-slate-400">
                    {docDone}/{docItems.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-slate-500">
              {completed} of {total} done
            </span>
            <span className="font-semibold text-slate-700">{progress}%</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Topics */}
        {filteredItems.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">
            No topics for this filter.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredItems.map((item) => (
              <TopicCard key={item.id} item={item} onToggle={toggleStatus} />
            ))}
          </div>
        )}

        <p className="text-xs text-slate-400 mt-6">
          Click a topic to cycle: pending → done → skipped
        </p>
      </div>
    );
  }

  // ── FULL PLAN VIEW (all days) ────────────────────────────────────────────
  const total = items.length;
  const completed = items.filter((i) => i.status === "completed").length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  const grouped = Object.values(
    items.reduce<Record<string, { date: string; items: PlanItem[] }>>(
      (acc, item) => {
        if (!acc[item.date]) acc[item.date] = { date: item.date, items: [] };
        acc[item.date].items.push(item);
        return acc;
      },
      {}
    )
  ).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-slate-500">
            {completed} of {total} topics done
          </span>
          <span className="font-semibold text-slate-700">{progress}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Day groups */}
      <div className="flex flex-col gap-6">
        {grouped.map((day) => (
          <div key={day.date}>
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`text-sm font-semibold ${
                  isToday(day.date)
                    ? "text-slate-900"
                    : isPast(day.date)
                    ? "text-slate-400"
                    : "text-slate-700"
                }`}
              >
                {formatDate(day.date)}
              </span>
              {isToday(day.date) && (
                <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium">
                  Today
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {day.items.map((item) => (
                <TopicCard key={item.id} item={item} onToggle={toggleStatus} />
              ))}
            </div>
          </div>
        ))}

        {/* Exam day */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
          <span className="text-sm font-semibold text-red-600">
            {formatDate(examDate)}
          </span>
          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
            Exam
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-6">
        Click a topic to cycle: pending → done → skipped
      </p>
    </div>
  );
}
