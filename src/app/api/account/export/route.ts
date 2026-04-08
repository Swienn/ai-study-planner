import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: courses }, { data: documents }, { data: plans }] = await Promise.all([
    supabase.from("courses").select("*").eq("user_id", user.id),
    supabase.from("documents").select("id, filename, course_id, created_at").eq("user_id", user.id),
    supabase.from("plans").select("*").eq("user_id", user.id),
  ]);

  const docIds = (documents ?? []).map((d) => d.id);
  const planIds = (plans ?? []).map((p) => p.id);

  const [{ data: topics }, { data: planItems }] = await Promise.all([
    docIds.length > 0
      ? supabase.from("topics").select("id, document_id, title, summary, difficulty, minutes, position").in("document_id", docIds)
      : Promise.resolve({ data: [] }),
    planIds.length > 0
      ? supabase.from("plan_items").select("*").in("plan_id", planIds)
      : Promise.resolve({ data: [] }),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at },
    courses: courses ?? [],
    documents: documents ?? [],
    topics: topics ?? [],
    plans: plans ?? [],
    plan_items: planItems ?? [],
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="studytool-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
