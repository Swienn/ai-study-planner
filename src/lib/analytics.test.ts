import { describe, it, expect } from "vitest";
import { daysUntil, computeStreak } from "./analytics";

describe("daysUntil", () => {
  it("returns 0 for the same day", () => {
    expect(daysUntil("2026-01-10", "2026-01-10")).toBe(0);
  });
  it("returns positive for a future date", () => {
    expect(daysUntil("2026-01-15", "2026-01-10")).toBe(5);
  });
  it("returns negative for a past date", () => {
    expect(daysUntil("2026-01-05", "2026-01-10")).toBe(-5);
  });
  it("handles month boundaries", () => {
    expect(daysUntil("2026-02-01", "2026-01-30")).toBe(2);
  });
});

describe("computeStreak", () => {
  it("counts consecutive days ending today", () => {
    expect(computeStreak(["2026-01-08", "2026-01-09", "2026-01-10"], "2026-01-10")).toBe(3);
  });
  it("still counts when today isn't done yet but yesterday was", () => {
    expect(computeStreak(["2026-01-08", "2026-01-09"], "2026-01-10")).toBe(2);
  });
  it("breaks on a gap", () => {
    expect(computeStreak(["2026-01-06", "2026-01-09", "2026-01-10"], "2026-01-10")).toBe(2);
  });
  it("is zero when the most recent completion is older than yesterday", () => {
    expect(computeStreak(["2026-01-01"], "2026-01-10")).toBe(0);
  });
  it("is zero with no completions", () => {
    expect(computeStreak([], "2026-01-10")).toBe(0);
  });
  it("ignores duplicate dates", () => {
    expect(computeStreak(["2026-01-10", "2026-01-10", "2026-01-09"], "2026-01-10")).toBe(2);
  });
});
