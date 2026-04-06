import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { document_id, title, exam_date, hours_per_day } = body;

  if (!document_id || !title || !exam_date || !hours_per_day) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify the document belongs to this user
  const { data: doc } = await supabase
    .from("documents")
    .select("id")
    .eq("id", document_id)
    .eq("user_id", user.id)
    .single();

  if (!doc) return Response.json({ error: "Document not found" }, { status: 404 });

  // Fetch topics in order
  const { data: topics } = await supabase
    .from("topics")
    .select("id, position")
    .eq("document_id", document_id)
    .order("position");

  if (!topics || topics.length === 0) {
    return Response.json({ error: "No topics found for this document" }, { status: 400 });
  }

  // Planning logic: distribute topics evenly across available days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(exam_date);
  exam.setHours(0, 0, 0, 0);
  const availableDays = Math.max(1, Math.round((exam.getTime() - today.getTime()) / 86400000));
  const topicsPerDay = Math.ceil(topics.length / availableDays);

  // Create plan
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .insert({ user_id: user.id, title, exam_date, hours_per_day })
    .select()
    .single();

  if (planError || !plan) {
    return Response.json({ error: "Failed to create plan" }, { status: 500 });
  }

  // Link document to plan
  await supabase.from("plan_documents").insert({ plan_id: plan.id, document_id });

  // Create plan items — one per topic, assigned to a day starting tomorrow
  const planItems = topics.map((topic, index) => {
    const dayOffset = Math.floor(index / topicsPerDay) + 1;
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);
    return {
      plan_id: plan.id,
      topic_id: topic.id,
      date: date.toISOString().split("T")[0],
      status: "pending" as const,
    };
  });

  const { error: itemsError } = await supabase.from("plan_items").insert(planItems);

  if (itemsError) {
    await supabase.from("plans").delete().eq("id", plan.id);
    return Response.json({ error: "Failed to create plan items" }, { status: 500 });
  }

  return Response.json({ plan }, { status: 201 });
}
