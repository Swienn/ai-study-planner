"use client";

import { useState } from "react";

type Status = "pending" | "completed" | "skipped";

type Topic = {
  id: string;
  title: string;
  summary: string;
  difficulty: 1 | 2 | 3;
};

type PlanItem = {
  id: string;
  date: string;
  status: Status;
  topics: Topic;
};

type GroupedDay = {
  date: string;
  items: PlanItem[];
};

const difficultyLabel = { 1: "Easy", 2: "Medium", 3: "Hard" } as const;
const difficultyColor = {
  1: "bg-green-100 text-green-700",
  2: "bg-yellow-100 text-yellow-700",
  3: "bg-red-100 text-red-700",
} as const;

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

export default function PlanView({
  initialItems,
  examDate,
}: {
  initialItems: PlanItem[];
  examDate: string;
}) {
  const [items, setItems] = useState<PlanItem[]>(initialItems);

  const total = items.length;
  const completed = items.filter((i) => i.status === "completed").length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Group by date
  const grouped: GroupedDay[] = Object.values(
    items.reduce<Record<string, GroupedDay>>((acc, item) => {
      if (!acc[item.date]) acc[item.date] = { date: item.date, items: [] };
      acc[item.date].items.push(item);
      return acc;
    }, {})
  ).sort((a, b) => a.date.localeCompare(b.date));

  async function toggleStatus(item: PlanItem) {
    const next: Status =
      item.status === "pending"
        ? "completed"
        : item.status === "completed"
        ? "skipped"
        : "pending";

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: next } : i))
    );

    const res = await fetch(`/api/plan-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    if (!res.ok) {
      // Revert on failure
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: item.status } : i))
      );
    }
  }

  const statusIcon: Record<Status, string> = {
    pending: "○",
    completed: "✓",
    skipped: "–",
  };

  const statusStyle: Record<Status, string> = {
    pending: "border-gray-300 text-gray-400",
    completed: "border-green-500 bg-green-500 text-white",
    skipped: "border-gray-300 bg-gray-100 text-gray-400",
  };

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">{completed} of {total} topics done</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-black rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Day list */}
      <div className="flex flex-col gap-6">
        {grouped.map((day) => (
          <div key={day.date}>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-sm font-semibold ${
                  isToday(day.date)
                    ? "text-black"
                    : isPast(day.date)
                    ? "text-gray-400"
                    : "text-gray-700"
                }`}
              >
                {formatDate(day.date)}
              </span>
              {isToday(day.date) && (
                <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">
                  Today
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {day.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleStatus(item)}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors hover:bg-gray-50 ${
                    item.status === "skipped" ? "opacity-50" : ""
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
                          item.status === "completed" ? "line-through text-gray-400" : ""
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
                    <p className="text-xs text-gray-500 mt-0.5">{item.topics.summary}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Exam day */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
          <span className="text-sm font-semibold text-red-600">
            {formatDate(examDate)}
          </span>
          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
            Exam
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-6">
        Click a topic to cycle: pending → done → skipped
      </p>
    </div>
  );
}
