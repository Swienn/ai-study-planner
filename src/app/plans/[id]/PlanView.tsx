"use client";

import { useState } from "react";
import Link from "next/link";
import TopicStudyPanel from "./TopicStudyPanel";

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
  pending: "",
  completed: "✓",
  skipped: "–",
};

const statusStyle: Record<Status, string> = {
  pending: "border-slate-300",
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
  onReschedule,
  showReschedule,
  selectable,
  selected,
  onSelect,
}: {
  item: PlanItem;
  onToggle: (item: PlanItem) => void;
  onReschedule?: (item: PlanItem) => void;
  showReschedule?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (item: PlanItem) => void;
}) {
  return (
    <div
      className={`relative group flex items-start gap-3 p-4 rounded-xl border transition-all hover:shadow-sm ${
        selected
          ? "border-primary ring-2 ring-primary/30 bg-white"
          : item.status === "skipped"
          ? "border-border opacity-50 bg-white"
          : item.status === "completed"
          ? "border-green-200 bg-green-50"
          : "border-border bg-white hover:border-slate-300"
      }`}
    >
      {/* Circle toggles done */}
      <button
        onClick={() => onToggle(item)}
        title={item.status === "completed" ? "Mark not done" : "Mark done"}
        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold ${statusStyle[item.status]}`}
      >
        {statusIcon[item.status]}
      </button>
      {/* Body selects (day view) or toggles (full plan) */}
      <button
        onClick={() => (selectable && onSelect ? onSelect(item) : onToggle(item))}
        className="flex-1 min-w-0 text-left"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-sm font-medium ${
              item.status === "completed" ? "line-through text-slate-400" : "text-slate-800"
            }`}
          >
            {item.topics.title}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${difficultyColor[item.topics.difficulty]}`}>
            {difficultyLabel[item.topics.difficulty]}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
          {item.topics.summary}
        </p>
        {selectable && (
          <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary">
            Study
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </button>
      {showReschedule && item.status === "pending" && onReschedule && (
        <button
          onClick={() => onReschedule(item)}
          title="Move to next available day"
          className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-400 hover:text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-50 flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
          Next day
        </button>
      )}
    </div>
  );
}

export default function PlanView({
  initialItems,
  examDate,
  documents,
  initialDate,
  planId,
  isPaid = false,
}: {
  initialItems: PlanItem[];
  examDate: string;
  documents: Document[];
  initialDate: string | null;
  planId: string;
  isPaid?: boolean;
}) {
  const [items, setItems] = useState<PlanItem[]>(initialItems);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  async function toggleStatus(item: PlanItem) {
    const next: Status = item.status === "completed" ? "pending" : "completed";

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

  async function rescheduleItem(item: PlanItem) {
    // Optimistically remove from current date (will appear on new date after refresh)
    const res = await fetch(`/api/plan-items/${item.id}/reschedule`, { method: "POST" });
    const data = await res.json();
    if (res.ok && data.newDate) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, date: data.newDate } : i))
      );
    }
  }

  async function rescheduleAll() {
    setRescheduling(true);
    setRescheduleError(null);
    const res = await fetch(`/api/plans/${planId}/reschedule`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setRescheduleError(data.error ?? "Something went wrong");
      setRescheduling(false);
      return;
    }
    // Apply updated dates to items
    if (data.updated?.length) {
      const updatedMap = new Map(
        data.updated.map((u: { id: string; date: string }) => [u.id, u.date])
      );
      setItems((prev) =>
        prev.map((i) => (updatedMap.has(i.id) ? { ...i, date: updatedMap.get(i.id) as string } : i))
      );
    }
    setRescheduling(false);
  }

  // ── DAY VIEW ────────────────────────────────────────────────────────────────
  if (initialDate) {
    const dayItems = items.filter((i) => i.date === initialDate);
    const overdueCount = items.filter(
      (i) => isPast(i.date) && i.date !== initialDate && i.status === "pending"
    ).length;

    const docIdsOnDay = new Set(
      dayItems.map((i) => i.topics.document_id).filter(Boolean)
    );
    const dayDocs = documents.filter((d) => docIdsOnDay.has(d.id));

    const filteredItems =
      activeTab === "all"
        ? dayItems
        : dayItems.filter((i) => i.topics.document_id === activeTab);

    const total = filteredItems.length;
    const completed = filteredItems.filter((i) => i.status === "completed").length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    const allTotal = dayItems.length;
    const allCompleted = dayItems.filter((i) => i.status === "completed").length;

    const selectedItem =
      filteredItems.find((i) => i.topics.id === selectedTopicId) ?? filteredItems[0] ?? null;

    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold text-slate-800">
              {formatDate(initialDate)}
            </h2>
            {isToday(initialDate) && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                Today
              </span>
            )}
          </div>
          <Link
            href={`/plans/${planId}`}
            className="text-sm px-3 py-1.5 border border-border rounded-xl text-slate-600 hover:bg-accent transition-colors font-medium"
          >
            Full plan →
          </Link>
        </div>

        {overdueCount > 0 && (
          <Link
            href={`/plans/${planId}`}
            className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-5 hover:bg-amber-100 transition-colors"
          >
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-amber-800 flex-1">
              <span className="font-medium">{overdueCount} overdue {overdueCount === 1 ? "topic" : "topics"}</span> from previous days — view full plan to reschedule
            </p>
            <span className="text-xs text-amber-600 font-medium">View →</span>
          </Link>
        )}

        {/* Two columns: topic list (left) + study panel (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] gap-6 items-start">
          <div>
            {dayDocs.length > 0 && (
              <div className="flex gap-1 mb-4 p-1 bg-muted rounded-xl w-fit max-w-full overflow-x-auto">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === "all" ? "bg-background text-slate-900 shadow-sm" : "text-muted-foreground hover:text-slate-700"
                  }`}
                >
                  All
                  <span className="ml-1.5 text-xs text-slate-400">{allCompleted}/{allTotal}</span>
                </button>
                {dayDocs.map((doc) => {
                  const docItems = dayItems.filter((i) => i.topics.document_id === doc.id);
                  const docDone = docItems.filter((i) => i.status === "completed").length;
                  const shortName = doc.filename.replace(/\.pdf$/i, "").slice(0, 22);
                  return (
                    <button
                      key={doc.id}
                      onClick={() => setActiveTab(doc.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === doc.id ? "bg-background text-slate-900 shadow-sm" : "text-muted-foreground hover:text-slate-700"
                      }`}
                    >
                      {shortName}
                      <span className="ml-1.5 text-xs text-slate-400">{docDone}/{docItems.length}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mb-5">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-500">{completed} of {total} done</span>
                <span className="font-semibold text-slate-700">{progress}%</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-gradient rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No topics for this filter.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredItems.map((item) => (
                  <TopicCard
                    key={item.id}
                    item={item}
                    onToggle={toggleStatus}
                    selectable
                    selected={selectedItem?.id === item.id}
                    onSelect={(it) => setSelectedTopicId(it.topics.id)}
                  />
                ))}
              </div>
            )}

            <p className="text-xs text-slate-400 mt-4">
              Click the circle to mark a topic done · click a topic to study it
            </p>
          </div>

          {/* Study panel */}
          <div className="lg:sticky lg:top-6">
            {selectedItem ? (
              <TopicStudyPanel topic={selectedItem.topics} isPaid={isPaid} />
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-slate-400">
                Select a topic to study it — summary, tutor chat, flashcards, and quizzes.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── FULL PLAN VIEW ──────────────────────────────────────────────────────────
  const total = items.length;
  const completed = items.filter((i) => i.status === "completed").length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  const hasPastPending = items.some(
    (i) => isPast(i.date) && i.status === "pending"
  );

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
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-slate-500">{completed} of {total} topics done</span>
          <span className="font-semibold text-slate-700">{progress}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Reschedule button — always visible */}
      <div className={`flex items-center gap-3 p-3 rounded-xl mb-6 border ${hasPastPending ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"}`}>
        {hasPastPending && (
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        )}
        <p className={`flex-1 text-sm ${hasPastPending ? "text-amber-800 font-medium" : "text-slate-500"}`}>
          {hasPastPending ? "You have overdue topics — reschedule from today forward." : "Redistribute all pending topics from today forward."}
        </p>
        {rescheduleError && <p className="text-xs text-red-600">{rescheduleError}</p>}
        <button
          onClick={rescheduleAll}
          disabled={rescheduling}
          className={`flex-shrink-0 text-sm px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${hasPastPending ? "bg-amber-600 text-white hover:bg-amber-700" : "border border-slate-200 text-slate-600 hover:bg-white"}`}
        >
          {rescheduling ? "Rescheduling…" : "Reschedule"}
        </button>
      </div>

      {/* Day groups */}
      <div className="flex flex-col gap-6">
        {grouped.map((day) => {
          const pastWithPending =
            isPast(day.date) && day.items.some((i) => i.status === "pending");

          return (
            <div key={day.date}>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`text-sm font-semibold ${
                    isToday(day.date)
                      ? "text-slate-900"
                      : pastWithPending
                      ? "text-amber-600"
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
                {pastWithPending && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    Overdue
                  </span>
                )}
              </div>
              <div className={`flex flex-col gap-2 ${pastWithPending ? "border-l-2 border-amber-300 pl-3" : ""}`}>
                {day.items.map((item) => (
                  <TopicCard
                    key={item.id}
                    item={item}
                    onToggle={toggleStatus}
                    onReschedule={rescheduleItem}
                    showReschedule={true}
                  />
                ))}
              </div>
            </div>
          );
        })}

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
        Click a topic to mark it done or undone · Hover to move it to the next day
      </p>
    </div>
  );
}
