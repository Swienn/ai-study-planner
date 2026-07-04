import type { SupabaseClient } from "@supabase/supabase-js";

// Per-user cap on AI generation calls across ALL AI endpoints (chat, summary,
// flashcards, quiz, exam mode). Replaces the previous per-table rate-limit
// buckets, which counted the wrong rows (e.g. summary counted chat_messages).
// App-level monthly spend is capped separately; this just stops runaway loops.
const PER_MINUTE = 20;

/**
 * Returns true if the user is under the per-minute AI cap, logging this call.
 * Only call it on the path that actually invokes Claude (not on cache hits).
 */
export async function allowAiUsage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string
): Promise<boolean> {
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  if ((count ?? 0) >= PER_MINUTE) return false;

  await supabase.from("ai_usage").insert({ user_id: userId });
  return true;
}
