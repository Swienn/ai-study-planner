// Pure scheduling logic — no Supabase imports, fully testable.
// Works exclusively with YYYY-MM-DD date strings to avoid timezone issues.
// Scheduling unit is MINUTES, not topic count.

export type TopicWithTime = { id: string; minutes: number };
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
 * Distributes topics across days from startDate until (but not including) examDate.
 * Each topic has an estimated study time in minutes. Topics are scheduled so the
 * total minutes per day stays within the student's daily budget, with harder/longer
 * topics naturally taking more of the day than quick ones.
 *
 * @param topics         - topics in desired study order, each with id + estimated minutes
 * @param startDateStr   - first day to schedule (YYYY-MM-DD)
 * @param examDateStr    - exam date, excluded from scheduling (YYYY-MM-DD)
 * @param hoursPerDay    - hours the student plans to study per day
 * @param existingLoad   - map of date → minutes already scheduled from other plans
 */
export function schedulePlan(
  topics: TopicWithTime[],
  startDateStr: string,
  examDateStr: string,
  hoursPerDay: number,
  existingLoad: Map<string, number>
): ScheduledItem[] {
  const budgetPerDay = hoursPerDay * 60; // convert to minutes
  const totalDays = Math.max(1, daysBetween(startDateStr, examDateStr));

  // Build list of candidate dates (startDate up to but not including exam day)
  const candidates: string[] = [];
  for (let i = 0; i < totalDays; i++) {
    candidates.push(addDays(startDateStr, i));
  }
  if (candidates.length === 0) candidates.push(startDateStr);

  // Available minutes per day after accounting for other plans
  const availablePerDay = candidates.map((date) =>
    Math.max(0, budgetPerDay - (existingLoad.get(date) ?? 0))
  );
  const totalAvailable = availablePerDay.reduce((a, b) => a + b, 0);
  const totalNeeded = topics.reduce((sum, t) => sum + t.minutes, 0);

  // If topics exceed available time, scale up each day's budget proportionally
  let effectivePerDay = [...availablePerDay];
  if (totalNeeded > totalAvailable && candidates.length > 0) {
    const extraPerDay = Math.ceil((totalNeeded - totalAvailable) / candidates.length);
    effectivePerDay = availablePerDay.map((m) => m + extraPerDay);
  }

  const result: ScheduledItem[] = [];
  let topicIndex = 0;

  for (let di = 0; di < candidates.length; di++) {
    if (topicIndex >= topics.length) break;

    const date = candidates[di];
    let minutesLeft = effectivePerDay[di];

    // Fill this day until the budget runs out or no topics left
    while (topicIndex < topics.length) {
      const topic = topics[topicIndex];

      // Always schedule at least one topic per day (even if it slightly overruns)
      const isFirstOnDay = minutesLeft === effectivePerDay[di];
      if (!isFirstOnDay && topic.minutes > minutesLeft) break;

      result.push({ topic_id: topic.id, date });
      minutesLeft -= topic.minutes;
      topicIndex++;
    }
  }

  // Safety fallback (should not be reached with overflow spreading)
  if (topicIndex < topics.length) {
    const lastDate = candidates[candidates.length - 1];
    while (topicIndex < topics.length) {
      result.push({ topic_id: topics[topicIndex].id, date: lastDate });
      topicIndex++;
    }
  }

  return result;
}
