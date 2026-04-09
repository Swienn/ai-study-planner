import { createClient } from "@/lib/supabase/server";
import { schedulePlan, type TopicWithTime } from "@/lib/planScheduler";

export const runtime = "nodejs";

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return dt.toISOString().split("T")[0];
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Verify plan belongs to user
  const { data: plan } = await supabase
    .from("plans")
    .select("id, exam_date, hours_per_day")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!plan) return Response.json({ error: "Plan not found" }, { status: 404 });

  const todayStr = new Date().toISOString().split("T")[0];
  const startStr = addDays(todayStr, 1);

  if (plan.exam_date <= todayStr) {
    return Response.json({ error: "Exam date has passed" }, { status: 400 });
  }

  // Fetch pending items from today onward (keep past completed/skipped as-is)
  const { data: pendingItems } = await supabase
    .from("plan_items")
    .select("id, topic_id, topics(id, position, minutes, document_id)")
    .eq("plan_id", id)
    .eq("status", "pending")
    .gte("date", todayStr)
    .order("date");

  if (!pendingItems || pendingItems.length === 0) {
    return Response.json({ message: "No pending topics to reschedule" });
  }

  // Preserve order: sort by current date then topic position
  const topics: TopicWithTime[] = pendingItems.map((item) => {
    const t = Array.isArray(item.topics) ? item.topics[0] : item.topics;
    return {
      id: item.topic_id,
      minutes: (t as { minutes?: number } | null)?.minutes ?? 30,
    };
  });

  // Build existing load from OTHER plans
  const { data: otherPlans } = await supabase
    .from("plans")
    .select("id")
    .eq("user_id", user.id)
    .neq("id", id);

  const otherPlanIds = (otherPlans ?? []).map((p) => p.id);
  const existingLoad = new Map<string, number>();

  if (otherPlanIds.length > 0) {
    const { data: otherItems } = await supabase
      .from("plan_items")
      .select("date, topics(minutes)")
      .in("plan_id", otherPlanIds)
      .neq("status", "skipped")
      .gte("date", startStr);

    (otherItems ?? []).forEach((item) => {
      const t = Array.isArray(item.topics) ? item.topics[0] : item.topics;
      const mins = (t as { minutes?: number } | null)?.minutes ?? 30;
      existingLoad.set(item.date, (existingLoad.get(item.date) ?? 0) + mins);
    });
  }

  // Fetch agenda blocks
  const { data: blocks } = await supabase
    .from("agenda_blocks")
    .select("date")
    .eq("user_id", user.id)
    .gte("date", startStr)
    .lte("date", plan.exam_date);

  const blockedDates = new Set((blocks ?? []).map((b) => b.date));

  const scheduled = schedulePlan(
    topics,
    startStr,
    plan.exam_date,
    plan.hours_per_day,
    existingLoad,
    blockedDates
  );

  // Update each pending item's date
  const pendingIds = pendingItems.map((i) => i.id);
  const topicToNewDate = new Map(scheduled.map((s) => [s.topic_id, s.date]));

  const updates = pendingItems.map((item) => ({
    id: item.id,
    date: topicToNewDate.get(item.topic_id) ?? startStr,
  }));

  // Batch update — Supabase doesn't support bulk updates, do them in parallel
  await Promise.all(
    updates.map(({ id: itemId, date }) =>
      supabase.from("plan_items").update({ date }).eq("id", itemId).eq("plan_id", id)
    )
  );

  // Return updated items for optimistic UI refresh
  const { data: updatedItems } = await supabase
    .from("plan_items")
    .select("id, date, status, topics(id, title, summary, difficulty, document_id)")
    .in("id", pendingIds);

  return Response.json({ updated: updatedItems ?? [] });
}
