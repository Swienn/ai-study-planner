import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CalendarClient, { type CalendarItem } from "./CalendarClient";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch plans, courses, and plan_items in separate queries to avoid fragile nested joins
  const [{ data: userPlans }, { data: courses }] = await Promise.all([
    supabase.from("plans").select("id, title, course_id").eq("user_id", user.id),
    supabase.from("courses").select("id, title, color").eq("user_id", user.id),
  ]);

  const planIds = (userPlans ?? []).map((p) => p.id);
  let items: CalendarItem[] = [];

  if (planIds.length > 0) {
    const { data: planItems } = await supabase
      .from("plan_items")
      .select("id, date, status, plan_id, topics(id, title)")
      .in("plan_id", planIds)
      .order("date");

    // Build lookup maps
    const courseMap = Object.fromEntries((courses ?? []).map((c) => [c.id, c]));
    const planMap = Object.fromEntries((userPlans ?? []).map((p) => [p.id, p]));

    items = (planItems ?? []).map((item) => {
      const plan = planMap[item.plan_id];
      const course = plan?.course_id ? courseMap[plan.course_id] ?? null : null;
      const topicsRaw = item.topics;
      const topic = Array.isArray(topicsRaw) ? topicsRaw[0] : topicsRaw;

      return {
        item_id: item.id,
        date: item.date,
        status: item.status as CalendarItem["status"],
        topic_title: (topic as { title?: string } | null)?.title ?? "Topic",
        plan_id: item.plan_id,
        course_id: course?.id ?? null,
        course_title: course?.title ?? null,
        course_color: course?.color ?? null,
      };
    });
  }

  const now = new Date();

  return (
    <main className="flex flex-col items-center min-h-screen p-8">
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-black">← Dashboard</Link>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <div className="w-24" />
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="mb-2">No study plans yet.</p>
            <Link href="/dashboard" className="text-sm text-black underline">Go to dashboard →</Link>
          </div>
        ) : (
          <CalendarClient
            items={items}
            initialYear={now.getFullYear()}
            initialMonth={now.getMonth()}
          />
        )}
      </div>
    </main>
  );
}
