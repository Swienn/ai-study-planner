import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Records an error to the `error_logs` table for observability (Phase 10.7).
 *
 * Uses the service-role client because error_logs has RLS enabled with no user
 * policies. Logging must NEVER throw — a failure here is swallowed so it can't
 * cascade into the very code path that's already failing.
 */
export async function logError(entry: {
  source: "server" | "client";
  route?: string | null;
  message: string;
  stack?: string | null;
  userId?: string | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("error_logs").insert({
      source: entry.source,
      route: entry.route ? entry.route.slice(0, 500) : null,
      message: (entry.message || "Unknown error").slice(0, 2000),
      stack: entry.stack ? entry.stack.slice(0, 8000) : null,
      user_id: entry.userId ?? null,
    });
  } catch {
    // Intentionally swallowed — logging is best-effort.
  }
}
