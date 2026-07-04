import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Scores a submitted quiz server-side. The correct answers live only here — they
// are never sent to the client until the user submits, at which point we return
// which option was correct per question so results can be shown.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: topicId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const answers = ((body ?? {}) as { answers?: unknown }).answers;
  if (typeof answers !== "object" || answers === null) {
    return Response.json({ error: "Invalid answers" }, { status: 400 });
  }
  const answerMap = answers as Record<string, unknown>;

  // RLS scopes to the user's own quiz rows.
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, correct_index")
    .eq("topic_id", topicId)
    .eq("user_id", user.id)
    .order("position");

  if (!questions || questions.length === 0) {
    return Response.json({ error: "No quiz found" }, { status: 404 });
  }

  let score = 0;
  const results = questions.map((q) => {
    const selectedRaw = answerMap[q.id];
    const selected = typeof selectedRaw === "number" ? selectedRaw : null;
    const correct = selected === q.correct_index;
    if (correct) score++;
    return { id: q.id, correct_index: q.correct_index, selected, correct };
  });

  return Response.json({ score, total: questions.length, results });
}
