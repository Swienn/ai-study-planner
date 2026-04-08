import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Delete storage files (PDFs)
  const { data: documents } = await supabase
    .from("documents")
    .select("id")
    .eq("user_id", user.id);

  if (documents && documents.length > 0) {
    const paths = documents.map((d) => `${user.id}/${d.id}.pdf`);
    await supabase.storage.from("documents").remove(paths);
  }

  // Delete the auth user — cascades to profiles, courses, documents, plans via FK ON DELETE CASCADE
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return Response.json({ error: "Failed to delete account" }, { status: 500 });
  }

  return Response.json({ deleted: true });
}
