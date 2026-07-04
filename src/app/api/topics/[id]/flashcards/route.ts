import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/anthropic";
import { allowAiUsage } from "@/lib/aiUsage";
import { requirePaidTopicAccess } from "@/lib/studyTools";
import { logError } from "@/lib/errorLog";

export const runtime = "nodejs";

type Card = { front: string; back: string };

// Load cached flashcards for a topic (no generation, no paid gate — the UI
// shows a locked state to free users).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: topicId } = await params;
  const { data } = await supabase
    .from("flashcards")
    .select("id, front, back")
    .eq("topic_id", topicId)
    .eq("user_id", user.id)
    .order("position");

  return Response.json({ flashcards: data ?? [] });
}

// Generate (and cache) flashcards for a topic. Paid tiers only.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: topicId } = await params;

  const access = await requirePaidTopicAccess(supabase, user.id, topicId);
  if ("error" in access) return Response.json({ error: access.error }, { status: access.status });

  // Return cached set if it already exists — generation is one-time per topic.
  const { data: existing } = await supabase
    .from("flashcards")
    .select("id, front, back")
    .eq("topic_id", topicId)
    .eq("user_id", user.id)
    .order("position");
  if (existing && existing.length > 0) {
    return Response.json({ flashcards: existing });
  }

  const allowed = await allowAiUsage(supabase, user.id);
  if (!allowed) return Response.json({ error: "Too many requests — wait a minute" }, { status: 429 });

  let cards: Card[];
  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Create 6-8 study flashcards for the topic "${access.topic.title}": ${access.topic.summary}.

Return ONLY a valid JSON array — no markdown, no code fences. Each element: { "front": "<question or term, max 120 chars>", "back": "<clear answer, max 300 chars>" }. Make them test genuine understanding, not trivia.`,
        },
      ],
    });
    const block = message.content[0];
    if (!block || block.type !== "text") throw new Error("Unexpected Claude response");
    const match = block.text.match(/\[[\s\S]*\]/);
    cards = JSON.parse(match ? match[0] : block.text);
    if (!Array.isArray(cards)) throw new Error("Not an array");
  } catch (e) {
    await logError({
      source: "server",
      route: "/api/topics/[id]/flashcards",
      message: `Flashcard generation failed: ${(e as Error).message}`,
      stack: (e as Error).stack,
      userId: user.id,
    });
    return Response.json({ error: "Couldn't generate flashcards — please try again" }, { status: 502 });
  }

  const rows = cards
    .filter((c) => c && typeof c.front === "string" && typeof c.back === "string")
    .slice(0, 12)
    .map((c, i) => ({
      topic_id: topicId,
      user_id: user.id,
      front: c.front.slice(0, 300),
      back: c.back.slice(0, 600),
      position: i,
    }));

  const { data: inserted, error: insErr } = await supabase
    .from("flashcards")
    .insert(rows)
    .select("id, front, back");

  if (insErr) {
    // A concurrent request already generated this set (blocked by the
    // (user_id, topic_id, position) unique constraint) — return the cached set
    // instead of duplicating it.
    const { data: existingNow } = await supabase
      .from("flashcards")
      .select("id, front, back")
      .eq("topic_id", topicId)
      .eq("user_id", user.id)
      .order("position");
    return Response.json({ flashcards: existingNow ?? [] });
  }

  return Response.json({ flashcards: inserted ?? [] });
}
