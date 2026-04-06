"use client";

import { useState } from "react";
import Link from "next/link";

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

const colorDot: Record<string, string> = {
  red: "bg-red-500", orange: "bg-orange-500", yellow: "bg-yellow-400",
  green: "bg-green-500", blue: "bg-blue-500", purple: "bg-purple-500",
};
const colorBadge: Record<string, string> = {
  red: "bg-red-100 text-red-700", orange: "bg-orange-100 text-orange-700",
  yellow: "bg-yellow-100 text-yellow-700", green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700", purple: "bg-purple-100 text-purple-700",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  // 0=Sun, shift to Mon=0
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export default function CalendarClient({
  items,
  initialYear,
  initialMonth,
}: {
  items: CalendarItem[];
  initialYear: number;
  initialMonth: number;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  function prev() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Group items by date for the current month
  const byDate: Record<string, CalendarItem[]> = {};
  items.forEach(item => {
    if (!byDate[item.date]) byDate[item.date] = [];
    byDate[item.date].push(item);
  });

  // Build calendar grid cells
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedItems = selectedDate ? (byDate[selectedDate] ?? []) : [];

  // Unique courses per day (for dots)
  function getCourseDots(dateStr: string) {
    const dayItems = byDate[dateStr] ?? [];
    const seen = new Set<string>();
    return dayItems.filter(item => {
      const key = item.course_id ?? "none";
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prev} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold">{MONTHS[month]} {year}</h2>
        <button onClick={next} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const dots = getCourseDots(dateStr);
          const hasItems = dots.length > 0;

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={`relative flex flex-col items-center rounded-lg py-2 px-1 transition-colors
                ${isSelected ? "bg-black text-white" : isToday ? "bg-gray-100 font-bold" : "hover:bg-gray-50"}
                ${hasItems ? "cursor-pointer" : "cursor-default"}`}
            >
              <span className="text-sm">{day}</span>
              {dots.length > 0 && (
                <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                  {dots.slice(0, 3).map((item, di) => (
                    <span
                      key={di}
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? "bg-white" : colorDot[item.course_color ?? "blue"] ?? "bg-gray-400"
                      }`}
                    />
                  ))}
                  {dots.length > 3 && (
                    <span className={`text-[8px] ${isSelected ? "text-white" : "text-gray-400"}`}>+{dots.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Day detail panel */}
      {selectedDate && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold mb-3">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-GB", {
              weekday: "long", day: "numeric", month: "long",
            })}
          </h3>
          {selectedItems.length === 0 ? (
            <p className="text-sm text-gray-400">Nothing scheduled.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedItems.map(item => (
                <Link
                  key={item.item_id}
                  href={`/plans/${item.plan_id}`}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colorDot[item.course_color ?? "blue"] ?? "bg-gray-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${item.status === "completed" ? "line-through text-gray-400" : ""}`}>
                      {item.topic_title}
                    </p>
                    {item.course_title && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${colorBadge[item.course_color ?? "blue"] ?? "bg-gray-100 text-gray-600"}`}>
                        {item.course_title}
                      </span>
                    )}
                  </div>
                  {item.status === "completed" && <span className="text-xs text-green-600">✓</span>}
                  {item.status === "skipped" && <span className="text-xs text-gray-400">–</span>}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
