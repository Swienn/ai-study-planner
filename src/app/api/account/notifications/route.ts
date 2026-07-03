import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Update the signed-in user's notification preferences.
// profiles has no user UPDATE policy (keeps tier immutable), so this writes
// via the service role — but only ever the notification_preferences column,
// and only for the authenticated user's own row.
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { daily_reminder, exam_countdown } = (body ?? {}) as {
    daily_reminder?: unknown;
    exam_countdown?: unknown;
  };
  if (typeof daily_reminder !== "boolean" || typeof exam_countdown !== "boolean") {
    return Response.json({ error: "Invalid preferences" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ notification_preferences: { daily_reminder, exam_countdown } })
    .eq("user_id", user.id);

  if (error) return Response.json({ error: "Update failed" }, { status: 500 });
  return Response.json({ ok: true, daily_reminder, exam_countdown });
}
