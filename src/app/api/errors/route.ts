import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rateLimit";
import { logError } from "@/lib/errorLog";

export const runtime = "nodejs";

// Receives client-side error reports from the app's error boundaries.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message, stack, url } = (body ?? {}) as {
    message?: unknown;
    stack?: unknown;
    url?: unknown;
  };
  if (typeof message !== "string" || !message.trim()) {
    return Response.json({ error: "Invalid report" }, { status: 400 });
  }

  // Rate-limit to prevent log-flooding (admin client so RLS doesn't hide the count).
  const admin = createAdminClient();
  if (user) {
    const allowed = await checkRateLimit(admin, user.id, "error_logs", 30, 60_000);
    if (!allowed) return Response.json({ ok: true }); // silently drop
  } else {
    // Anonymous reporters (e.g. errors on public pages) share one global cap,
    // so an unauthenticated loop can't spam the table unbounded.
    const since = new Date(Date.now() - 60_000).toISOString();
    const { count } = await admin
      .from("error_logs")
      .select("id", { count: "exact", head: true })
      .is("user_id", null)
      .eq("source", "client")
      .gte("created_at", since);
    if ((count ?? 0) >= 60) return Response.json({ ok: true }); // silently drop
  }

  await logError({
    source: "client",
    route: typeof url === "string" ? url : null,
    message,
    stack: typeof stack === "string" ? stack : null,
    userId: user?.id ?? null,
  });

  return Response.json({ ok: true });
}
