// Pure analytics helpers (Phase 8.3/8.4) — no DB imports, fully testable.
// All date math is UTC-based on YYYY-MM-DD strings to avoid timezone drift.

const TZ = "Europe/Amsterdam";

export function todayStr(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function dayDiff(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

/** Whole days from `from` (default today) until `dateStr`. Negative if past. */
export function daysUntil(dateStr: string, from: string = todayStr()): number {
  return dayDiff(from, dateStr);
}

/**
 * Consecutive-day study streak ending today (or yesterday, so a not-yet-studied
 * today doesn't break a running streak). Input: dates a topic was completed.
 */
export function computeStreak(completedDates: string[], today: string = todayStr()): number {
  const days = new Set(completedDates);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
