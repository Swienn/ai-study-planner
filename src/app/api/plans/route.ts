import { createClient } from "@/lib/supabase/server";
import { schedulePlan } from "@/lib/planScheduler";

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return dt.toISOString().split("T")[0];
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { course_id, document_id, title, exam_date, start_date, hours_per_day } = body;

  if (!title || !exam_date || !hours_per_day || (!course_id && !document_id)) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Fetch topics — either from all documents in a course, or from a single document
  let topicIds: string[];
  let docIds: string[];

  if (course_id) {
    // Verify course belongs to user
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("id", course_id)
      .eq("user_id", user.id)
      .single();
    if (!course) return Response.json({ error: "Course not found" }, { status: 404 });

    // Get all documents in this course (ordered by upload date)
    const { data: docs } = await supabase
      .from("documents")
      .select("id")
      .eq("course_id", course_id)
      .order("created_at");
    docIds = (docs ?? []).map((d) => d.id);

    if (docIds.length === 0) {
      return Response.json({ error: "Upload at least one PDF to this course first" }, { status: 400 });
    }

    // Get all topics across all course documents, ordered by document then position
    const { data: topics } = await supabase
      .from("topics")
      .select("id, document_id, position")
      .in("document_id", docIds)
      .order("position");

    // Sort by document order, then by position within document
    const docOrder = Object.fromEntries(docIds.map((id, i) => [id, i]));
    topicIds = (topics ?? [])
      .sort((a, b) => docOrder[a.document_id] - docOrder[b.document_id] || a.position - b.position)
      .map((t) => t.id);
  } else {
    // Legacy: single document path
    const { data: doc } = await supabase
      .from("documents")
      .select("id")
      .eq("id", document_id)
      .eq("user_id", user.id)
      .single();
    if (!doc) return Response.json({ error: "Document not found" }, { status: 404 });

    docIds = [document_id];
    const { data: topics } = await supabase
      .from("topics")
      .select("id")
      .eq("document_id", document_id)
      .order("position");
    topicIds = (topics ?? []).map((t) => t.id);
  }

  if (topicIds.length === 0) {
    return Response.json({ error: "No topics found" }, { status: 400 });
  }

  // Build existing load map for conflict-aware scheduling
  const { data: userPlans } = await supabase
    .from("plans")
    .select("id")
    .eq("user_id", user.id);

  const planIds = (userPlans ?? []).map((p) => p.id);
  const existingLoad = new Map<string, number>();

  if (planIds.length > 0) {
    const { data: existingItems } = await supabase
      .from("plan_items")
      .select("date")
      .in("plan_id", planIds)
      .neq("status", "skipped")
      .gte("date", new Date().toISOString().split("T")[0]);

    (existingItems ?? []).forEach((item) => {
      existingLoad.set(item.date, (existingLoad.get(item.date) ?? 0) + 1);
    });
  }

  // Schedule topics across days — use provided start_date or default to tomorrow
  const todayStr = new Date().toISOString().split("T")[0];
  const startStr = start_date && start_date > todayStr ? start_date : addDays(todayStr, 1);
  const scheduled = schedulePlan(topicIds, startStr, exam_date, hours_per_day, existingLoad);

  // Create plan
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .insert({
      user_id: user.id,
      title,
      exam_date,
      hours_per_day,
      ...(course_id ? { course_id } : {}),
    })
    .select()
    .single();

  if (planError || !plan) {
    return Response.json({ error: "Failed to create plan" }, { status: 500 });
  }

  // Link documents to plan
  await supabase.from("plan_documents").insert(
    docIds.map((doc_id) => ({ plan_id: plan.id, document_id: doc_id }))
  );

  // Insert plan items
  const planItems = scheduled.map((s) => ({
    plan_id: plan.id,
    topic_id: s.topic_id,
    date: s.date,
    status: "pending" as const,
  }));

  const { error: itemsError } = await supabase.from("plan_items").insert(planItems);

  if (itemsError) {
    await supabase.from("plans").delete().eq("id", plan.id);
    return Response.json({ error: "Failed to create plan items" }, { status: 500 });
  }

  return Response.json({ plan }, { status: 201 });
}
