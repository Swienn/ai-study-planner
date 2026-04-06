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
  const maxPerDay = Math.max(2, Math.ceil(hoursPerDay));
  const totalDays = Math.max(1, daysBetween(startDateStr, examDateStr));

  // Build list of candidate dates (startDate up to but not including exam day)
  const candidates: string[] = [];
  for (let i = 0; i < totalDays; i++) {
    candidates.push(addDays(startDateStr, i));
  }
  if (candidates.length === 0) candidates.push(startDateStr); // edge: exam is on start date

  const result: ScheduledItem[] = [];
  const newLoad = new Map<string, number>(); // slots added by this plan so far
  let topicIndex = 0;

  for (let di = 0; di < candidates.length; di++) {
    if (topicIndex >= topicIds.length) break;

    const date = candidates[di];
    const existing = existingLoad.get(date) ?? 0;
    const added = newLoad.get(date) ?? 0;
    const totalLoad = existing + added;
    const remainingTopics = topicIds.length - topicIndex;
    const remainingDates = candidates.length - di;

    // Skip this day if it's full AND there's enough room on later days
    const canDefer = remainingTopics <= remainingDates * maxPerDay;
    if (totalLoad >= maxPerDay && canDefer) continue;

    // How many topics to assign today
    const slots = Math.max(1, maxPerDay - totalLoad);
    const assign = Math.min(slots, remainingTopics);

    for (let s = 0; s < assign; s++) {
      result.push({ topic_id: topicIds[topicIndex], date });
      topicIndex++;
      newLoad.set(date, (newLoad.get(date) ?? 0) + 1);
    }
  }

  // Safety: if topics remain after all days, pile onto the last candidate
  if (topicIndex < topicIds.length) {
    const lastDate = candidates[candidates.length - 1];
    while (topicIndex < topicIds.length) {
      result.push({ topic_id: topicIds[topicIndex], date: lastDate });
      topicIndex++;
    }
  }

  return result;
}
