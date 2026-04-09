import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { date } = await request.json();
  if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Invalid date" }, { status: 400 });
  }

  // Check if block exists
  const { data: existing } = await supabase
    .from("agenda_blocks")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();

  if (existing) {
    await supabase.from("agenda_blocks").delete().eq("id", existing.id);
    return Response.json({ action: "deleted" });
  } else {
    await supabase.from("agenda_blocks").insert({ user_id: user.id, date });
    return Response.json({ action: "created" });
  }
}
