import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CalendarClient, { type CalendarItem } from "./CalendarClient";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch all plan items for this user with course info
  const { data: userPlans } = await supabase
    .from("plans")
    .select("id, title, course_id, courses(id, title, color)")
    .eq("user_id", user.id);

  const planIds = (userPlans ?? []).map(p => p.id);

  let items: CalendarItem[] = [];

  if (planIds.length > 0) {
    const { data: planItems } = await supabase
      .from("plan_items")
      .select("id, date, status, topic_id, plan_id, topics(title)")
      .in("plan_id", planIds)
      .order("date");

    // Build a lookup from plan_id to course info
    const planInfo = Object.fromEntries(
      (userPlans ?? []).map(p => {
        const course = p.courses as unknown as { id: string; title: string; color: string } | null;
        return [p.id, { plan_title: p.title, course }];
      })
    );

    items = (planItems ?? []).map(item => {
      const info = planInfo[item.plan_id];
      const topic = item.topics as unknown as { title: string } | null;
      return {
        item_id: item.id,
        date: item.date,
        status: item.status as CalendarItem["status"],
        topic_title: topic?.title ?? "Topic",
        plan_id: item.plan_id,
        course_id: info?.course?.id ?? null,
        course_title: info?.course?.title ?? null,
        course_color: info?.course?.color ?? null,
      };
    });
  }

  const now = new Date();

  return (
    <main className="flex flex-col items-center min-h-screen p-8">
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-black">← Dashboard</Link>
          </div>
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
