// Pure scheduling logic — no Supabase imports, fully testable.
// Works exclusively with YYYY-MM-DD date strings to avoid timezone issues.

export type ScheduledItem = { topic_id: string; date: string };

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return dt.toISOString().split("T")[0];
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const msA = new Date(ay, am - 1, ad).getTime();
  const msB = new Date(by, bm - 1, bd).getTime();
  return Math.round((msB - msA) / 86400000);
}

/**
 * Distributes topics across days from startDate until (but not including) examDate,
 * respecting capacity limits and existing load from other plans.
 *
 * @param topicIds       - topic IDs in desired study order
 * @param startDateStr   - first day to schedule topics (YYYY-MM-DD)
 * @param examDateStr    - exam date as YYYY-MM-DD (excluded)
 * @param hoursPerDay    - hours the student plans to study per day
 * @param existingLoad   - map of date → count of items already scheduled (from other plans)
 */
export function schedulePlan(
  topicIds: string[],
  startDateStr: string,
  examDateStr: string,
  hoursPerDay: number,
  existingLoad: Map<string, number>
): ScheduledItem[] {
  // ~30 minutes per topic, minimum 3 per day
  const basePerDay = Math.max(3, Math.round(hoursPerDay * 2));
  const totalDays = Math.max(1, daysBetween(startDateStr, examDateStr));

  // Build list of candidate dates (startDate up to but not including exam day)
  const candidates: string[] = [];
  for (let i = 0; i < totalDays; i++) {
    candidates.push(addDays(startDateStr, i));
  }
  if (candidates.length === 0) candidates.push(startDateStr);

  // Calculate per-day capacity respecting existing load from other plans
  const capacityPerDay = candidates.map((date) =>
    Math.max(0, basePerDay - (existingLoad.get(date) ?? 0))
  );
  const totalCapacity = capacityPerDay.reduce((a, b) => a + b, 0);

  // If topics exceed capacity, spread the overflow evenly across all days
  let effectiveCapacity = [...capacityPerDay];
  if (topicIds.length > totalCapacity && candidates.length > 0) {
    const overflow = topicIds.length - totalCapacity;
    const extraPerDay = Math.ceil(overflow / candidates.length);
    effectiveCapacity = capacityPerDay.map((cap) => cap + extraPerDay);
  }

  const result: ScheduledItem[] = [];
  let topicIndex = 0;

  for (let di = 0; di < candidates.length; di++) {
    if (topicIndex >= topicIds.length) break;
    const date = candidates[di];
    const slots = effectiveCapacity[di];
    const assign = Math.min(slots, topicIds.length - topicIndex);
    for (let s = 0; s < assign; s++) {
      result.push({ topic_id: topicIds[topicIndex], date });
      topicIndex++;
    }
  }

  // Safety fallback (should not be reached with overflow spreading)
  if (topicIndex < topicIds.length) {
    const lastDate = candidates[candidates.length - 1];
    while (topicIndex < topicIds.length) {
      result.push({ topic_id: topicIds[topicIndex], date: lastDate });
      topicIndex++;
    }
  }

  return result;
}
