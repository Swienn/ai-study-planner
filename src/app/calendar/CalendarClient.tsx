"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type CalendarItem = {
  item_id: string;
  date: string;
  status: "pending" | "completed" | "skipped";
  topic_title: string;
  plan_id: string;
  course_id: string | null;
  course_title: string | null;
  course_color: string | null;
};

export type CourseWithPlan = {
  id: string;
  title: string;
  color: string;
  planId: string | null;
};

const colorDot: Record<string, string> = {
  red: "bg-red-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-400",
  green: "bg-green-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
};

const colorCell: Record<string, string> = {
  red: "ring-red-300 bg-red-50 hover:ring-red-400",
  orange: "ring-orange-300 bg-orange-50 hover:ring-orange-400",
  yellow: "ring-yellow-300 bg-yellow-50 hover:ring-yellow-400",
  green: "ring-green-300 bg-green-50 hover:ring-green-400",
  blue: "ring-blue-300 bg-blue-50 hover:ring-blue-400",
  purple: "ring-purple-300 bg-purple-50 hover:ring-purple-400",
};

const colorCount: Record<string, string> = {
  red: "text-red-700",
  orange: "text-orange-700",
  yellow: "text-yellow-700",
  green: "text-green-700",
  blue: "text-blue-700",
  purple: "text-purple-700",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates(offset: number): string[] {
  const today = new Date();
  const day = today.getDay(); // 0=Sun … 6=Sat
  const mondayDiff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayDiff + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

function formatWeekRange(dates: string[]) {
  const first = new Date(dates[0] + "T00:00:00");
  const last = new Date(dates[6] + "T00:00:00");
  const sameMonth =
    first.getMonth() === last.getMonth() &&
    first.getFullYear() === last.getFullYear();

  if (sameMonth) {
    return `${first.toLocaleDateString("en-GB", { month: "short" })} ${first.getDate()} – ${last.getDate()}, ${last.getFullYear()}`;
  }
  return `${first.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${last.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
}

export default function CalendarClient({
  items,
  courses,
  initialBlockedDates = [],
}: {
  items: CalendarItem[];
  courses: CourseWithPlan[];
  initialBlockedDates?: string[];
}) {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [blocked, setBlocked] = useState<Set<string>>(() => new Set(initialBlockedDates));

  async function toggleBlock(date: string) {
    // Optimistic update
    setBlocked((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
    await fetch("/api/agenda-blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
  }
  const weekDates = getWeekDates(weekOffset);
  const todayStr = new Date().toISOString().split("T")[0];

  // Group items by course_id → date
  const byCourseDate: Record<string, Record<string, CalendarItem[]>> = {};
  for (const item of items) {
    if (!item.course_id) continue;
    if (!byCourseDate[item.course_id]) byCourseDate[item.course_id] = {};
    if (!byCourseDate[item.course_id][item.date])
      byCourseDate[item.course_id][item.date] = [];
    byCourseDate[item.course_id][item.date].push(item);
  }

  return (
    <div className="p-6">
      {/* Week navigation */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          aria-label="Previous week"
        >
          <svg
            className="w-4 h-4 text-slate-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="font-semibold text-slate-800 text-base min-w-48 text-center">
          {formatWeekRange(weekDates)}
        </span>

        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          aria-label="Next week"
        >
          <svg
            className="w-4 h-4 text-slate-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {weekOffset !== 0 && (
          <button
            onClick={() => setWeekOffset(0)}
            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium"
          >
            Today
          </button>
        )}
      </div>

      {/* Calendar grid */}
      {courses.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-slate-300"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
            </svg>
          </div>
          <p className="font-medium text-slate-500 mb-1">No courses yet</p>
          <p className="text-sm mb-4">Create a course to start planning your studies</p>
          <a
            href="/onboarding"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Get started →
          </a>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Header row */}
            <div className="grid gap-1.5 mb-2" style={{ gridTemplateColumns: "180px repeat(7, 1fr)" }}>
              <div /> {/* empty corner */}
              {weekDates.map((date, i) => {
                const isToday = date === todayStr;
                const d = new Date(date + "T00:00:00");
                return (
                  <div
                    key={date}
                    className={`text-center py-2 rounded-xl ${isToday ? "bg-indigo-50" : ""}`}
                  >
                    <p
                      className={`text-xs font-medium ${isToday ? "text-indigo-500" : "text-slate-400"}`}
                    >
                      {DAYS[i]}
                    </p>
                    <p
                      className={`text-sm font-semibold ${isToday ? "text-indigo-700" : "text-slate-700"}`}
                    >
                      {d.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Blocked days row */}
            <div className="grid gap-1.5 mb-1" style={{ gridTemplateColumns: "180px repeat(7, 1fr)" }}>
              <div className="flex items-center px-3 py-2">
                <span className="text-xs font-medium text-slate-400">Blocked</span>
              </div>
              {weekDates.map((date) => {
                const isBlocked = blocked.has(date);
                return (
                  <button
                    key={date}
                    onClick={() => toggleBlock(date)}
                    title={isBlocked ? "Unblock this day" : "Block this day"}
                    className={`rounded-xl py-2 px-2 min-h-[40px] flex items-center justify-center transition-colors ${
                      isBlocked
                        ? "bg-slate-100 hover:bg-slate-200"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {isBlocked && (
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Course rows */}
            <div className="flex flex-col gap-2">
              {courses.map((course) => {
                const dot = colorDot[course.color] ?? "bg-blue-500";
                const cellColors = colorCell[course.color] ?? colorCell.blue;
                const countColor = colorCount[course.color] ?? colorCount.blue;

                return (
                  <div
                    key={course.id}
                    className="grid gap-1.5"
                    style={{ gridTemplateColumns: "180px repeat(7, 1fr)" }}
                  >
                    {/* Course label */}
                    <a
                      href={`/courses/${course.id}`}
                      className="flex items-center gap-2.5 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
                      <span className="text-sm font-medium text-slate-700 truncate group-hover:text-slate-900">
                        {course.title}
                      </span>
                    </a>

                    {/* Day cells */}
                    {weekDates.map((date) => {
                      const dayItems = byCourseDate[course.id]?.[date] ?? [];
                      const total = dayItems.length;
                      const done = dayItems.filter(
                        (i) => i.status === "completed"
                      ).length;
                      const isToday = date === todayStr;
                      const canNavigate = total > 0 && course.planId;

                      return (
                        <button
                          key={date}
                          onClick={() =>
                            canNavigate &&
                            router.push(`/plans/${course.planId}?date=${date}`)
                          }
                          disabled={!canNavigate}
                          className={`rounded-xl py-3 px-2 transition-all text-center min-h-[60px] flex flex-col items-center justify-center ${
                            total > 0
                              ? `ring-1 ${cellColors} cursor-pointer`
                              : isToday
                              ? "bg-slate-50 cursor-default"
                              : "bg-white cursor-default"
                          }`}
                        >
                          {total > 0 ? (
                            <>
                              <span className={`text-xs font-bold ${countColor}`}>
                                {done}/{total}
                              </span>
                              <div className="flex gap-0.5 flex-wrap justify-center mt-1.5">
                                {dayItems.slice(0, 5).map((item, idx) => (
                                  <span
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      item.status === "completed"
                                        ? dot
                                        : "bg-slate-200"
                                    }`}
                                  />
                                ))}
                                {total > 5 && (
                                  <span className="text-[9px] text-slate-400 leading-none mt-px">
                                    +{total - 5}
                                  </span>
                                )}
                              </div>
                            </>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
