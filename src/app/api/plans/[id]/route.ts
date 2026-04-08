import { createClient } from "@/lib/supabase/server";
import { schedulePlan, type TopicWithTime } from "@/lib/planScheduler";

export const runtime = "nodejs";

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return dt.toISOString().split("T")[0];
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("plans")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return Response.json({ error: "Delete failed" }, { status: 500 });
  return Response.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { exam_date, start_date, hours_per_day } = body;
  if (!exam_date || !hours_per_day) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const parsedHours = parseFloat(hours_per_day);
  if (isNaN(parsedHours) || parsedHours < 0.5 || parsedHours > 12) {
    return Response.json({ error: "hours_per_day must be between 0.5 and 12" }, { status: 400 });
  }

  const todayValidation = new Date().toISOString().split("T")[0];
  if (typeof exam_date !== "string" || exam_date <= todayValidation) {
    return Response.json({ error: "Exam date must be in the future" }, { status: 400 });
  }

  // Verify plan belongs to user
  const { data: plan } = await supabase
    .from("plans")
    .select("id, course_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!plan) return Response.json({ error: "Plan not found" }, { status: 404 });

  // Get topics via plan_documents → documents → topics
  const { data: planDocs } = await supabase
    .from("plan_documents")
    .select("document_id")
    .eq("plan_id", id);

  const docIds = (planDocs ?? []).map((pd) => pd.document_id);
  if (docIds.length === 0) {
    return Response.json({ error: "No documents linked to this plan" }, { status: 400 });
  }

  // Fetch documents in upload order
  const { data: docs } = await supabase
    .from("documents")
    .select("id")
    .in("id", docIds)
    .order("created_at");
  const orderedDocIds = (docs ?? []).map((d) => d.id);

  const { data: rawTopics } = await supabase
    .from("topics")
    .select("id, document_id, position, minutes")
    .in("document_id", orderedDocIds)
    .order("position");

  const docOrder = Object.fromEntries(orderedDocIds.map((docId, i) => [docId, i]));
  const topics: TopicWithTime[] = (rawTopics ?? [])
    .sort((a, b) => docOrder[a.document_id] - docOrder[b.document_id] || a.position - b.position)
    .map((t) => ({ id: t.id, minutes: t.minutes ?? 30 }));

  if (topics.length === 0) {
    return Response.json({ error: "No topics found" }, { status: 400 });
  }

  // Build existing load (in minutes) from all OTHER user plans
  const { data: userPlans } = await supabase
    .from("plans")
    .select("id")
    .eq("user_id", user.id)
    .neq("id", id);

  const otherPlanIds = (userPlans ?? []).map((p) => p.id);
  const existingLoad = new Map<string, number>();

  if (otherPlanIds.length > 0) {
    const { data: existingItems } = await supabase
      .from("plan_items")
      .select("date, topics(minutes)")
      .in("plan_id", otherPlanIds)
      .neq("status", "skipped")
      .gte("date", new Date().toISOString().split("T")[0]);

    (existingItems ?? []).forEach((item) => {
      const t = Array.isArray(item.topics) ? item.topics[0] : item.topics;
      const mins = (t as { minutes?: number } | null)?.minutes ?? 30;
      existingLoad.set(item.date, (existingLoad.get(item.date) ?? 0) + mins);
    });
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const startStr = start_date && start_date > todayStr ? start_date : addDays(todayStr, 1);
  const scheduled = schedulePlan(topics, startStr, exam_date, parsedHours, existingLoad);

  // Replace plan items atomically: delete old, insert new
  const { error: deleteError } = await supabase
    .from("plan_items")
    .delete()
    .eq("plan_id", id);
  if (deleteError) return Response.json({ error: "Failed to clear plan" }, { status: 500 });

  const planItems = scheduled.map((s) => ({
    plan_id: id,
    topic_id: s.topic_id,
    date: s.date,
    status: "pending" as const,
  }));

  const { error: insertError } = await supabase.from("plan_items").insert(planItems);
  if (insertError) return Response.json({ error: "Failed to insert plan items" }, { status: 500 });

  // Update plan metadata
  const { data: updatedPlan, error: updateError } = await supabase
    .from("plans")
    .update({ exam_date, hours_per_day: parsedHours })
    .eq("id", id)
    .select()
    .single();
  if (updateError) return Response.json({ error: "Failed to update plan" }, { status: 500 });

  return Response.json({ plan: updatedPlan });
}
