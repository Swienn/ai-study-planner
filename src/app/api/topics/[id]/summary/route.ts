import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/anthropic";
import { allowAiUsage } from "@/lib/aiUsage";
import { logError } from "@/lib/errorLog";

export const runtime = "nodejs";
// Claude (Haiku) calls can exceed Vercel's 10s Hobby default; give them room.
export const maxDuration = 60;

const DOC_CONTEXT_CHARS = 6000;

// Load the cached study summary for a topic (shared with exam mode via
// topics.study_guide).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: topicId } = await params;
  const { data } = await supabase
    .from("topics")
    .select("study_guide")
    .eq("id", topicId)
    .single();

  return Response.json({ summary: data?.study_guide ?? null });
}

// Generate (and cache) a study-focused summary for a topic. Available to all
// tiers — this is a core study aid (flashcards/quizzes are the paid extras).
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: topicId } = await params;

  // Ownership check via RLS.
  const { data: topic } = await supabase
    .from("topics")
    .select("id, title, summary, study_guide, document_id")
    .eq("id", topicId)
    .single();
  if (!topic) return Response.json({ error: "Topic not found" }, { status: 404 });

  if (topic.study_guide) {
    return Response.json({ summary: topic.study_guide });
  }

  const allowed = await allowAiUsage(supabase, user.id);
  if (!allowed) return Response.json({ error: "Too many requests — wait a minute" }, { status: 429 });

  // Optional grounding in the source document.
  let docContext = "";
  if (topic.document_id) {
    const { data: doc } = await supabase
      .from("documents")
      .select("raw_text")
      .eq("id", topic.document_id)
      .single();
    if (doc?.raw_text) docContext = doc.raw_text.slice(0, DOC_CONTEXT_CHARS);
  }

  let summary: string;
  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system:
        "You write clear, study-focused summaries that help a student learn a specific topic. Use short paragraphs and a few bullet points for key takeaways. Be accurate and concise. Use simple Markdown (bold for key terms, '- ' for bullets).",
      messages: [
        {
          role: "user",
          content: `Write a study summary for the topic "${topic.title}" (${topic.summary}). Focus on the most important concepts to understand and remember for an exam.${docContext ? `\n\nSource material:\n${docContext}` : ""}`,
        },
      ],
    });
    const block = message.content[0];
    summary = block && block.type === "text" ? block.text : "";
    if (!summary.trim()) throw new Error("Empty summary");
  } catch (e) {
    await logError({
      source: "server",
      route: "/api/topics/[id]/summary",
      message: `Summary generation failed: ${(e as Error).message}`,
      stack: (e as Error).stack,
      userId: user.id,
    });
    return Response.json({ error: "Couldn't generate a summary — please try again" }, { status: 502 });
  }

  const { error: cacheErr } = await supabase
    .from("topics")
    .update({ study_guide: summary.slice(0, 4000) })
    .eq("id", topicId);
  if (cacheErr) {
    // Not fatal — the summary is still returned — but surface it so a
    // silently-failing cache (which re-bills Claude next time) is visible.
    await logError({
      source: "server",
      route: "/api/topics/[id]/summary",
      message: `study_guide cache write failed: ${cacheErr.message}`,
      userId: user.id,
    });
  }

  return Response.json({ summary: summary.slice(0, 4000) });
}
