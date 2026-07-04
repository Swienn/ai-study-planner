import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/anthropic";
import { allowAiUsage } from "@/lib/aiUsage";
import { requirePaidTopicAccess } from "@/lib/studyTools";
import { logError } from "@/lib/errorLog";

export const runtime = "nodejs";

type RawQuestion = { question: string; options: string[]; correct_index: number };

// Load cached quiz questions WITHOUT correct_index — the answer is never sent to
// the client; scoring happens server-side in the /quiz/score route.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: topicId } = await params;
  const { data } = await supabase
    .from("quiz_questions")
    .select("id, question, options")
    .eq("topic_id", topicId)
    .eq("user_id", user.id)
    .order("position");

  return Response.json({ questions: data ?? [] });
}

// Generate (and cache) a quiz for a topic. Paid tiers only.
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

  const { data: existing } = await supabase
    .from("quiz_questions")
    .select("id, question, options")
    .eq("topic_id", topicId)
    .eq("user_id", user.id)
    .order("position");
  if (existing && existing.length > 0) {
    return Response.json({ questions: existing });
  }

  const allowed = await allowAiUsage(supabase, user.id);
  if (!allowed) return Response.json({ error: "Too many requests — wait a minute" }, { status: 429 });

  let questions: RawQuestion[];
  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Create 5 multiple-choice quiz questions for the topic "${access.topic.title}": ${access.topic.summary}.

Return ONLY a valid JSON array — no markdown, no code fences. Each element:
{ "question": "<question>", "options": ["<a>", "<b>", "<c>", "<d>"], "correct_index": <0-3> }.
Exactly 4 options each. Make distractors plausible.`,
        },
      ],
    });
    const block = message.content[0];
    if (!block || block.type !== "text") throw new Error("Unexpected Claude response");
    const match = block.text.match(/\[[\s\S]*\]/);
    questions = JSON.parse(match ? match[0] : block.text);
    if (!Array.isArray(questions)) throw new Error("Not an array");
  } catch (e) {
    await logError({
      source: "server",
      route: "/api/topics/[id]/quiz",
      message: `Quiz generation failed: ${(e as Error).message}`,
      stack: (e as Error).stack,
      userId: user.id,
    });
    return Response.json({ error: "Couldn't generate a quiz — please try again" }, { status: 502 });
  }

  const rows = questions
    .filter(
      (q) =>
        q &&
        typeof q.question === "string" &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        Number.isInteger(q.correct_index) &&
        q.correct_index >= 0 &&
        q.correct_index <= 3
    )
    .slice(0, 10)
    .map((q, i) => {
      // Shuffle options ONCE at generation time and persist that order, so the
      // answer position is randomized (Claude biases toward a fixed slot) and
      // the stored correct_index matches what the client will see.
      const order = [0, 1, 2, 3];
      for (let k = order.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1));
        [order[k], order[j]] = [order[j], order[k]];
      }
      return {
        topic_id: topicId,
        user_id: user.id,
        question: q.question.slice(0, 500),
        options: order.map((k) => String(q.options[k]).slice(0, 200)),
        correct_index: order.indexOf(q.correct_index),
        position: i,
      };
    });

  const { data: inserted, error: insErr } = await supabase
    .from("quiz_questions")
    .insert(rows)
    .select("id, question, options");

  if (insErr) {
    // A concurrent request already generated this quiz (unique constraint) —
    // return the cached set instead of duplicating.
    const { data: existingNow } = await supabase
      .from("quiz_questions")
      .select("id, question, options")
      .eq("topic_id", topicId)
      .eq("user_id", user.id)
      .order("position");
    return Response.json({ questions: existingNow ?? [] });
  }

  return Response.json({ questions: inserted ?? [] });
}
