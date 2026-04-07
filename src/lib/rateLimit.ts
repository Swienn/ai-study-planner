import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Checks whether a user has exceeded a rate limit by counting rows created
 * in the given table within the last `windowMs` milliseconds.
 *
 * Returns true if the request is allowed, false if it should be rejected.
 *
 * Note: uses a DB count, so it works in serverless environments without Redis.
 * There is a narrow race window for concurrent bursts — acceptable for this use case.
 */
export async function checkRateLimit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
  table: string,
  max: number,
  windowMs: number
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs).toISOString();

  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  return (count ?? 0) < max;
}
