import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserTier } from "@/lib/tier";

export type TopicContext = { id: string; title: string; summary: string };

/**
 * Gate flashcard/quiz generation (Phase 9) to paid tiers and verify the topic
 * belongs to the user (topics RLS scopes to the user's own documents).
 */
export async function requirePaidTopicAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
  topicId: string
): Promise<{ topic: TopicContext } | { error: string; status: 403 | 404 }> {
  const tier = await getUserTier(supabase, userId);
  if (tier === "free") {
    return { error: "Flashcards and quizzes are a Premium feature.", status: 403 };
  }

  const { data: topic } = await supabase
    .from("topics")
    .select("id, title, summary")
    .eq("id", topicId)
    .single();
  if (!topic) return { error: "Topic not found", status: 404 };

  return { topic: topic as TopicContext };
}
