import { describe, it, expect } from "vitest";
import { schedulePlan, type TopicWithTime, type ScheduledItem } from "./planScheduler";

// Helpers ------------------------------------------------------------------
function topics(n: number, minutes: number): TopicWithTime[] {
  return Array.from({ length: n }, (_, i) => ({ id: `t${i}`, minutes }));
}

function datesUsed(items: ScheduledItem[]): string[] {
  return [...new Set(items.map((i) => i.date))].sort();
}

function countByDate(items: ScheduledItem[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, i) => {
    acc[i.date] = (acc[i.date] ?? 0) + 1;
    return acc;
  }, {});
}

const noLoad = () => new Map<string, number>();

// Tests --------------------------------------------------------------------
describe("schedulePlan", () => {
  it("schedules every topic exactly once", () => {
    const ts = topics(6, 30);
    const result = schedulePlan(ts, "2026-01-01", "2026-01-05", 3, noLoad());

    expect(result).toHaveLength(6);
    const ids = result.map((r) => r.topic_id).sort();
    expect(ids).toEqual(ts.map((t) => t.id).sort());
  });

  it("never schedules on or after the exam date", () => {
    const result = schedulePlan(topics(20, 45), "2026-01-01", "2026-01-04", 2, noLoad());
    for (const item of result) {
      expect(item.date < "2026-01-04").toBe(true);
      expect(item.date >= "2026-01-01").toBe(true);
    }
  });

  it("keeps topics in study order (earlier topics never on a later day than later topics)", () => {
    const result = schedulePlan(topics(10, 40), "2026-01-01", "2026-01-06", 1, noLoad());
    // t0..t9 in order — the date sequence must be non-decreasing
    const orderedDates = result
      .sort((a, b) => Number(a.topic_id.slice(1)) - Number(b.topic_id.slice(1)))
      .map((r) => r.date);
    for (let i = 1; i < orderedDates.length; i++) {
      expect(orderedDates[i] >= orderedDates[i - 1]).toBe(true);
    }
  });

  it("respects the daily minutes budget when topics fit", () => {
    // 1h/day = 60 min budget; 60-min topics → exactly one per day
    const result = schedulePlan(topics(4, 60), "2026-01-01", "2026-01-05", 1, noLoad());
    const counts = countByDate(result);
    for (const date of Object.keys(counts)) {
      expect(counts[date]).toBe(1);
    }
    expect(datesUsed(result)).toHaveLength(4);
  });

  it("spreads overflow across all days when topics exceed capacity", () => {
    // 10 * 60 = 600 min needed, but only 2 days * 60 = 120 available.
    // Overflow logic scales each day's budget so all topics still fit.
    const result = schedulePlan(topics(10, 60), "2026-01-01", "2026-01-03", 1, noLoad());
    expect(result).toHaveLength(10);
    // Both days should be used rather than dumping everything on day one
    expect(datesUsed(result).length).toBeGreaterThan(1);
  });

  it("gives every day at least one topic under a tight budget", () => {
    // 60-min topics with a 60-min/day budget → exactly one per day, no day skipped
    const result = schedulePlan(topics(5, 60), "2026-01-01", "2026-01-07", 1, noLoad());
    const counts = countByDate(result);
    expect(datesUsed(result)).toHaveLength(5);
    for (const date of Object.keys(counts)) expect(counts[date]).toBeGreaterThanOrEqual(1);
  });

  it("front-loads: fills the earliest days first with no gaps between used days", () => {
    // 5 topics, 5 available days, generous budget → packs into the earliest days
    const result = schedulePlan(topics(5, 30), "2026-01-01", "2026-01-06", 2, noLoad());
    const used = datesUsed(result); // sorted ascending
    expect(used[0]).toBe("2026-01-01");
    const asUtc = (s: string) => {
      const [y, m, d] = s.split("-").map(Number);
      return Date.UTC(y, m - 1, d);
    };
    for (let i = 1; i < used.length; i++) {
      // consecutive days — the scheduler never leaves a gap before it runs out of topics
      expect((asUtc(used[i]) - asUtc(used[i - 1])) / 86400000).toBe(1);
    }
  });

  it("skips blocked days entirely", () => {
    const blocked = new Set(["2026-01-02", "2026-01-03"]);
    const result = schedulePlan(topics(6, 30), "2026-01-01", "2026-01-06", 1, noLoad(), blocked);
    for (const item of result) {
      expect(blocked.has(item.date)).toBe(false);
    }
    // still schedules every topic despite fewer days
    expect(result).toHaveLength(6);
  });

  it("assigns fewer topics to days already loaded by other plans", () => {
    // 2h/day = 120 min. Day one already has 60 min booked from another plan.
    const load = new Map<string, number>([["2026-01-01", 60]]);
    const result = schedulePlan(topics(4, 60), "2026-01-01", "2026-01-05", 2, load);
    const counts = countByDate(result);
    // Day one (60 min free → 1 topic) should hold no more than a fully-free day
    expect(counts["2026-01-01"] ?? 0).toBeLessThanOrEqual(counts["2026-01-02"] ?? 0);
  });

  it("handles exam date equal to start date (minimum one day)", () => {
    const result = schedulePlan(topics(3, 30), "2026-01-01", "2026-01-01", 2, noLoad());
    expect(result).toHaveLength(3);
    // falls back to the start date itself
    expect(datesUsed(result)).toEqual(["2026-01-01"]);
  });

  it("falls back to the start date when every day is blocked", () => {
    const blocked = new Set(["2026-01-01", "2026-01-02"]);
    const result = schedulePlan(topics(2, 30), "2026-01-01", "2026-01-03", 2, noLoad(), blocked);
    expect(result).toHaveLength(2);
    expect(datesUsed(result)).toEqual(["2026-01-01"]);
  });

  it("returns an empty array when there are no topics", () => {
    const result = schedulePlan([], "2026-01-01", "2026-01-05", 2, noLoad());
    expect(result).toEqual([]);
  });
});
