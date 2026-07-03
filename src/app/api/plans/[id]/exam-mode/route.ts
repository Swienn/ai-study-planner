import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/anthropic";
import { checkRateLimit } from "@/lib/rateLimit";
import { logError } from "@/lib/errorLog";

export const runtime = "nodejs";

const MAX_TOPICS = 60;

type TopicRow = { id: string; title: string; summary: string; study_guide: string | null };

async function planTopics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  planId: string
): Promise<TopicRow[]> {
  const { data: planDocs } = await supabase
    .from("plan_documents")
    .select("document_id")
    .eq("plan_id", planId);
  const docIds = (planDocs ?? []).map((d) => d.document_id);
  if (docIds.length === 0) return [];

  const { data: topics } = await supabase
    .from("topics")
    .select("id, title, summary, study_guide")
    .in("document_id", docIds)
    .order("position");
  return (topics ?? []) as TopicRow[];
}

// Generate condensed exam-mode study guides for a plan's topics (cached in
// topics.study_guide). Only fills topics that don't already have a guide.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: planId } = await params;

  // Ownership check (RLS scopes plans to the user).
  const { data: plan } = await supabase.from("plans").select("id").eq("id", planId).single();
  if (!plan) return Response.json({ error: "Plan not found" }, { status: 404 });

  const allowed = await checkRateLimit(supabase, user.id, "plans", 10, 60_000);
  if (!allowed) return Response.json({ error: "Too many requests — wait a minute" }, { status: 429 });

  const topics = await planTopics(supabase, planId);
  const missing = topics.filter((t) => !t.study_guide).slice(0, MAX_TOPICS);

  if (missing.length === 0) {
    return Response.json({ topics });
  }

  let guides: { id: string; guide: string }[];
  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are helping a student revise the night before an exam. For each topic below, write 3-5 concise, high-yield revision bullet points capturing the most important things to remember.

Return ONLY a valid JSON array — no markdown, no code fences. Each element: { "id": "<topic id>", "guide": "<bullet points as a single string, each bullet on its own line starting with '• '>" }.

Topics:
${JSON.stringify(missing.map((t) => ({ id: t.id, title: t.title, summary: t.summary })))}`,
        },
      ],
    });
    const block = message.content[0];
    if (!block || block.type !== "text") throw new Error("Unexpected Claude response");
    const match = block.text.match(/\[[\s\S]*\]/);
    guides = JSON.parse(match ? match[0] : block.text);
    if (!Array.isArray(guides)) throw new Error("Not an array");
  } catch (e) {
    await logError({
      source: "server",
      route: "/api/plans/[id]/exam-mode",
      message: `Study guide generation failed: ${(e as Error).message}`,
      stack: (e as Error).stack,
      userId: user.id,
    });
    return Response.json({ error: "Couldn't generate study guides — please try again" }, { status: 502 });
  }

  const validIds = new Set(missing.map((t) => t.id));
  for (const g of guides) {
    if (g && typeof g.id === "string" && typeof g.guide === "string" && validIds.has(g.id)) {
      await supabase.from("topics").update({ study_guide: g.guide.slice(0, 4000) }).eq("id", g.id);
    }
  }

  const refreshed = await planTopics(supabase, planId);
  return Response.json({ topics: refreshed });
}
