import { createClient } from "@/lib/supabase/server";

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

  // Fetch the item + its plan (to verify ownership and get exam_date)
  const { data: item } = await supabase
    .from("plan_items")
    .select("id, date, plan_id, plans(exam_date, user_id)")
    .eq("id", id)
    .single();

  if (!item) return Response.json({ error: "Item not found" }, { status: 404 });

  const plan = Array.isArray(item.plans) ? item.plans[0] : item.plans;
  if ((plan as { user_id: string } | null)?.user_id !== user.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const examDate = (plan as { exam_date: string }).exam_date;
  const todayStr = new Date().toISOString().split("T")[0];

  // Find the next non-blocked day after today (or after current date, whichever is later)
  const baseDate = item.date > todayStr ? item.date : todayStr;

  const { data: blocks } = await supabase
    .from("agenda_blocks")
    .select("date")
    .eq("user_id", user.id)
    .gte("date", addDays(baseDate, 1))
    .lte("date", examDate);

  const blockedSet = new Set((blocks ?? []).map((b) => b.date));

  // Find next available date (up to 30 days ahead)
  let targetDate = addDays(baseDate, 1);
  for (let i = 0; i < 30; i++) {
    if (!blockedSet.has(targetDate) && targetDate < examDate) break;
    targetDate = addDays(targetDate, 1);
  }

  if (targetDate >= examDate) {
    return Response.json({ error: "No available day before exam" }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from("plan_items")
    .update({ date: targetDate })
    .eq("id", id)
    .select()
    .single();

  if (error || !updated) {
    return Response.json({ error: "Update failed" }, { status: 500 });
  }

  return Response.json({ item: updated, newDate: targetDate });
}
