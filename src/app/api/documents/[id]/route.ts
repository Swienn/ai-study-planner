import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership before deleting
  const { data: doc } = await supabase
    .from("documents")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!doc) return Response.json({ error: "Not found" }, { status: 404 });

  // Delete storage file
  await supabase.storage.from("documents").remove([`${user.id}/${id}.pdf`]);

  // Delete document row (cascades to topics)
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return Response.json({ error: "Delete failed" }, { status: 500 });

  return Response.json({ ok: true });
}
