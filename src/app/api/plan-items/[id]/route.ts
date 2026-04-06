import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const VALID_STATUSES = ["pending", "completed", "skipped"] as const;
type Status = (typeof VALID_STATUSES)[number];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!VALID_STATUSES.includes(status as Status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  // RLS ensures users can only update their own plan items
  const { data, error } = await supabase
    .from("plan_items")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return Response.json({ error: "Update failed" }, { status: 500 });
  }

  return Response.json({ item: data });
}
