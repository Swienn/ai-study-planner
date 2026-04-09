import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppLayout from "@/components/AppLayout";
import CalendarClient, {
  type CalendarItem,
  type CourseWithPlan,
} from "./CalendarClient";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: userPlans }, { data: courses }, { data: agendaBlocks }] = await Promise.all([
    supabase
      .from("plans")
      .select("id, title, course_id")
      .eq("user_id", user.id),
    supabase
      .from("courses")
      .select("id, title, color")
      .eq("user_id", user.id)
      .order("created_at"),
    supabase
      .from("agenda_blocks")
      .select("date")
      .eq("user_id", user.id),
  ]);

  const planIds = (userPlans ?? []).map((p) => p.id);
  let items: CalendarItem[] = [];

  if (planIds.length > 0) {
    // Fetch plan_documents first to get document IDs
    const { data: planDocs } = await supabase
      .from("plan_documents")
      .select("document_id")
      .in("plan_id", planIds);

    const docIds = (planDocs ?? []).map((r) => r.document_id);

    const [{ data: planItems }, { data: allTopics }] = await Promise.all([
      supabase
        .from("plan_items")
        .select("id, date, status, plan_id, topic_id")
        .in("plan_id", planIds)
        .order("date"),
      docIds.length > 0
        ? supabase.from("topics").select("id, title").in("document_id", docIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    ]);

    const topicMap = Object.fromEntries(
      (allTopics ?? []).map((t) => [t.id, t])
    );
    const courseMap = Object.fromEntries(
      (courses ?? []).map((c) => [c.id, c])
    );
    const planMap = Object.fromEntries(
      (userPlans ?? []).map((p) => [p.id, p])
    );

    items = (planItems ?? []).map((item) => {
      const topic = topicMap[item.topic_id];
      const plan = planMap[item.plan_id];
      const course = plan?.course_id ? (courseMap[plan.course_id] ?? null) : null;
      return {
        item_id: item.id,
        date: item.date,
        status: item.status as CalendarItem["status"],
        topic_title: topic?.title ?? "Topic",
        plan_id: item.plan_id,
        course_id: course?.id ?? null,
        course_title: course?.title ?? null,
        course_color: course?.color ?? null,
      };
    });
  }

  const coursesWithPlan: CourseWithPlan[] = (courses ?? []).map((c) => {
    const plan = (userPlans ?? []).find((p) => p.course_id === c.id);
    return {
      id: c.id,
      title: c.title,
      color: c.color,
      planId: plan?.id ?? null,
    };
  });

  return (
    <AppLayout>
      <div className="flex items-center justify-between px-6 pt-6 mb-2">
        <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
      </div>
      <CalendarClient
        items={items}
        courses={coursesWithPlan}
        initialBlockedDates={(agendaBlocks ?? []).map((b) => b.date)}
      />
    </AppLayout>
  );
}
