"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SidebarCourse } from "./AppSidebar";

const colorDot: Record<string, string> = {
  red: "bg-red-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-400",
  green: "bg-green-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
};

const todayStr =
  typeof window !== "undefined"
    ? new Date().toISOString().split("T")[0]
    : "";

function formatSidebarDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function SidebarClient({
  courses,
  activePlanId,
  activeDate,
}: {
  courses: SidebarCourse[];
  activePlanId?: string;
  activeDate?: string;
}) {
  const pathname = usePathname();

  const initialExpanded = new Set<string>(
    courses
      .filter((c) => c.plan && c.plan.id === activePlanId)
      .map((c) => c.id)
  );
  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded);

  // Auto-expand course whose page is currently open
  const activeCourseId = courses.find((c) => pathname === `/courses/${c.id}`)?.id ?? null;

  function toggle(courseId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  }

  const isCalendarActive = pathname === "/calendar" && !activePlanId;

  return (
    <nav className="flex flex-col p-3 gap-0.5">
      {/* Calendar link */}
      <Link
        href="/calendar"
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isCalendarActive
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        Calendar
      </Link>

      {/* Courses section */}
      {courses.length > 0 && (
        <div className="mt-4">
          <p className="px-3 mb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            Courses
          </p>
          {courses.map((course) => {
            const dot = colorDot[course.color] ?? "bg-blue-500";
            const isExpanded = expanded.has(course.id);
            const isActivePlan = course.plan?.id === activePlanId;

            const isCourseActive = activeCourseId === course.id;
            const showExpanded = isExpanded || isCourseActive;

            return (
              <div key={course.id}>
                <div
                  className={`flex items-center gap-0.5 rounded-xl transition-all ${
                    isActivePlan && !activeDate || isCourseActive
                      ? "bg-slate-100"
                      : "hover:bg-slate-100"
                  }`}
                >
                  <Link
                    href={`/courses/${course.id}`}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium flex-1 min-w-0"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
                    <span className={`flex-1 truncate ${isCourseActive ? "text-slate-900" : "text-slate-700"}`}>
                      {course.title}
                    </span>
                  </Link>
                  {course.plan && course.plan.dates.length > 0 && (
                    <button
                      onClick={() => toggle(course.id)}
                      className="p-2 text-slate-400 hover:text-slate-600"
                      aria-label="Toggle dates"
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${showExpanded ? "rotate-90" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>

                {showExpanded && course.plan && course.plan.dates.length > 0 && (
                  <div className="ml-5 pl-3 border-l-2 border-slate-100 mt-0.5 mb-1 flex flex-col gap-0.5">
                    {course.plan.dates.map((date) => {
                      const isActive = isActivePlan && activeDate === date;
                      const isToday = date === todayStr;
                      return (
                        <Link
                          key={date}
                          href={`/plans/${course.plan!.id}?date=${date}`}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                            isActive
                              ? "bg-slate-900 text-white font-semibold"
                              : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          }`}
                        >
                          <span className="flex-1">{formatSidebarDate(date)}</span>
                          {isToday && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                isActive
                                  ? "bg-white text-slate-900"
                                  : "bg-indigo-100 text-indigo-600"
                              }`}
                            >
                              TODAY
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {courses.length === 0 && (
        <p className="px-3 py-2 text-xs text-slate-400">No courses yet</p>
      )}
    </nav>
  );
}
