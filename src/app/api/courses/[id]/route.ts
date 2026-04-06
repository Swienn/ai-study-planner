import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, color")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!course) return Response.json({ error: "Not found" }, { status: 404 });

  const [{ data: documents }, { data: plan }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, filename, created_at, topics(count)")
      .eq("course_id", id)
      .order("created_at"),
    supabase
      .from("plans")
      .select("id, title, exam_date")
      .eq("course_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return Response.json({ course, documents: documents ?? [], plan: plan ?? null });
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
    .from("courses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return Response.json({ error: "Delete failed" }, { status: 500 });
  return Response.json({ ok: true });
}
