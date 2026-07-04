import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { dailyReminderEmail, examCountdownEmail } from "@/lib/emails";

export const runtime = "nodejs";
// Never cache — this must run fresh each time the cron fires.
export const dynamic = "force-dynamic";

const TZ = "Europe/Amsterdam";
const COUNTDOWN_DAYS = 3;

type Prefs = { daily_reminder?: boolean; exam_countdown?: boolean };
type PlanRef = { id: string; title: string; user_id: string };

// Supabase types a `plans!inner(...)` embed as an array even though a
// to-one relationship returns a single object at runtime. Normalize both.
function planOf(row: unknown): PlanRef | null {
  const p = (row as { plans?: PlanRef | PlanRef[] }).plans;
  if (!p) return null;
  return Array.isArray(p) ? p[0] ?? null : p;
}

function ymdInTz(date: Date): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  // Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = ymdInTz(new Date());
  const examDay = addDays(today, COUNTDOWN_DAYS);

  // ---- Gather everything we need ----
  // Pending items due today, with their plan (title + owner).
  const { data: todayItems } = await supabase
    .from("plan_items")
    .select("plan_id, plans!inner(id, title, user_id)")
    .eq("date", today)
    .eq("status", "pending");

  // Plans whose exam is exactly COUNTDOWN_DAYS away.
  const { data: examPlans } = await supabase
    .from("plans")
    .select("id, title, user_id")
    .eq("exam_date", examDay);

  // Collect the set of users we might email, and load their preferences + email.
  const userIds = new Set<string>();
  for (const row of todayItems ?? []) {
    const plan = planOf(row);
    if (plan) userIds.add(plan.user_id);
  }
  for (const p of examPlans ?? []) userIds.add((p as PlanRef).user_id);

  if (userIds.size === 0) {
    return Response.json({ ok: true, today, sent: 0, note: "nothing to send" });
  }

  const [prefsMap, emailMap] = await Promise.all([
    loadPreferences(supabase, [...userIds]),
    loadEmails(supabase),
  ]);

  let sent = 0;
  const errors: string[] = [];

  // ---- Daily reminders ----
  // Group today's pending items per user, then per plan title.
  const perUser = new Map<string, Map<string, number>>();
  for (const row of todayItems ?? []) {
    const plan = planOf(row);
    if (!plan) continue;
    if (!perUser.has(plan.user_id)) perUser.set(plan.user_id, new Map());
    const byPlan = perUser.get(plan.user_id)!;
    byPlan.set(plan.title, (byPlan.get(plan.title) ?? 0) + 1);
  }

  for (const [userId, byPlan] of perUser) {
    if (prefsMap.get(userId)?.daily_reminder === false) continue;
    const email = emailMap.get(userId);
    if (!email) continue;

    const courses = [...byPlan.entries()].map(([title, count]) => ({ title, count }));
    const totalTopics = courses.reduce((sum, c) => sum + c.count, 0);
    const { subject, html } = dailyReminderEmail({ totalTopics, courses });
    // Idempotency: claim today's daily reminder for this user. If the cron
    // double-fires, the unique (user_id, kind, sent_date) blocks a second send.
    if (!(await claimReminder(supabase, userId, "daily", today))) continue;
    try {
      await sendEmail({ to: email, subject, html });
      sent++;
    } catch (e) {
      errors.push(`daily/${userId}: ${(e as Error).message}`);
    }
  }

  // ---- Exam countdowns ----
  for (const p of (examPlans ?? []) as PlanRef[]) {
    if (prefsMap.get(p.user_id)?.exam_countdown === false) continue;
    const email = emailMap.get(p.user_id);
    if (!email) continue;

    const { count } = await supabase
      .from("plan_items")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", p.id)
      .eq("status", "pending");
    const remaining = count ?? 0;
    if (remaining === 0) continue; // nothing left — no nag

    const { subject, html } = examCountdownEmail({
      courseTitle: p.title,
      daysUntil: COUNTDOWN_DAYS,
      remaining,
    });
    if (!(await claimReminder(supabase, p.user_id, "exam_countdown", today))) continue;
    try {
      await sendEmail({ to: email, subject, html });
      sent++;
    } catch (e) {
      errors.push(`exam/${p.user_id}: ${(e as Error).message}`);
    }
  }

  return Response.json({ ok: true, today, examDay, sent, errors });
}

// Records that a reminder was sent to a user today, returning false if it was
// already sent (unique (user_id, kind, sent_date) violation) — the idempotency
// guard against duplicate emails when the cron fires more than once.
async function claimReminder(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  kind: "daily" | "exam_countdown",
  sentDate: string
): Promise<boolean> {
  const { error } = await supabase
    .from("reminder_log")
    .insert({ user_id: userId, kind, sent_date: sentDate });
  if (!error) return true;
  // Unique violation → already sent today → skip this send.
  if ((error as { code?: string }).code === "23505") return false;
  // Any other error (e.g. reminder_log missing before the migration is applied)
  // → fail open and still send, rather than silently suppressing all reminders.
  return true;
}

async function loadPreferences(
  supabase: ReturnType<typeof createAdminClient>,
  userIds: string[]
): Promise<Map<string, Prefs>> {
  const { data } = await supabase
    .from("profiles")
    .select("user_id, notification_preferences")
    .in("user_id", userIds);
  const map = new Map<string, Prefs>();
  for (const row of data ?? []) {
    map.set(
      (row as { user_id: string }).user_id,
      ((row as { notification_preferences: Prefs }).notification_preferences) ?? {}
    );
  }
  return map;
}

async function loadEmails(
  supabase: ReturnType<typeof createAdminClient>
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let page = 1;
  const perPage = 1000;
  // Paginate through auth users to build an id → email map.
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error || !data) break;
    for (const u of data.users) {
      if (u.email) map.set(u.id, u.email);
    }
    if (data.users.length < perPage) break;
    page++;
  }
  return map;
}
