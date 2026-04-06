import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("courses")
    .select("id, title, color, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return Response.json({ courses: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, color } = body;

  if (!title?.trim()) return Response.json({ error: "Title is required" }, { status: 400 });

  const validColors = ["red", "orange", "yellow", "green", "blue", "purple"];
  const safeColor = validColors.includes(color) ? color : "blue";

  const { data, error } = await supabase
    .from("courses")
    .insert({ user_id: user.id, title: title.trim(), color: safeColor })
    .select()
    .single();

  if (error || !data) return Response.json({ error: "Failed to create course" }, { status: 500 });

  return Response.json({ course: data }, { status: 201 });
}
