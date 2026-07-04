import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppLayout from "@/components/AppLayout";
import PlanView from "./PlanView";
import PlanStats from "./PlanStats";
import { daysUntil, computeStreak, todayStr } from "@/lib/analytics";
import { getUserTier } from "@/lib/tier";

export const dynamic = "force-dynamic";
import DeletePlanButton from "./DeletePlanButton";

export default async function PlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string; item?: string }>;
}) {
  const { id } = await params;
  const { date: activeDate, item: selectedItem } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: plan } = await supabase
    .from("plans")
    .select("id, title, exam_date, hours_per_day, course_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!plan) notFound();

  // Fetch plan items + topic document_id
  const { data: rawItems } = await supabase
    .from("plan_items")
    .select("id, date, status, topics(id, title, summary, difficulty, document_id, minutes)")
    .eq("plan_id", id)
    .order("date");

  // Fetch documents linked to this plan
  const { data: planDocs } = await supabase
    .from("plan_documents")
    .select("document_id")
    .eq("plan_id", id);

  const docIds = (planDocs ?? []).map((pd) => pd.document_id);
  const { data: documents } =
    docIds.length > 0
      ? await supabase
          .from("documents")
          .select("id, filename")
          .in("id", docIds)
      : { data: [] as { id: string; filename: string }[] };

  type TopicRow = {
    id: string;
    title: string;
    summary: string;
    difficulty: 1 | 2 | 3;
    document_id: string | null;
    minutes: number;
  };

  const topicOf = (item: { topics: unknown }) =>
    (Array.isArray(item.topics) ? item.topics[0] : item.topics) as TopicRow | null;

  const items = (rawItems ?? []).map((item) => {
    const t = topicOf(item);
    return {
      id: item.id,
      date: item.date as string,
      status: item.status as "pending" | "completed" | "skipped",
      topics: {
        id: t?.id ?? "",
        title: t?.title ?? "",
        summary: t?.summary ?? "",
        difficulty: (t?.difficulty ?? 1) as 1 | 2 | 3,
        document_id: t?.document_id ?? null,
      },
    };
  });

  // ── Analytics (Phase 8.3/8.4) ──────────────────────────────────────────────
  const totalTopics = items.length;
  const completedTopics = items.filter((i) => i.status === "completed").length;
  const completionPct = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);
  const pendingMinutes = (rawItems ?? [])
    .filter((i) => i.status === "pending")
    .reduce((sum, i) => sum + (topicOf(i)?.minutes ?? 0), 0);
  const hoursRemaining = Math.round((pendingMinutes / 60) * 10) / 10;
  const daysUntilExam = daysUntil(plan.exam_date);

  // Study streak across all of the user's completed topics.
  const { data: completedRows } = await supabase
    .from("plan_items")
    .select("completed_at")
    .eq("status", "completed")
    .not("completed_at", "is", null);
  const completedDates = (completedRows ?? [])
    .map((r) => (r.completed_at ? todayStr(new Date(r.completed_at as string)) : null))
    .filter((d): d is string => d !== null);
  const streak = computeStreak(completedDates);

  const tier = await getUserTier(supabase, user.id);
  const isPaid = tier !== "free";

  return (
    <AppLayout activePlanId={id} activeDate={activeDate}>
      <div className={`p-6 pb-16 mx-auto ${activeDate ? "max-w-6xl" : "max-w-2xl"}`}>
        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href={plan.course_id ? `/courses/${plan.course_id}` : "/dashboard"}
            className="text-sm text-slate-400 hover:text-slate-700 transition-colors"
          >
            ← {plan.course_id ? "Course" : "Dashboard"}
          </Link>
          <DeletePlanButton planId={plan.id} courseId={plan.course_id ?? null} />
        </div>

        {/* Plan header */}
        <div className="flex items-center gap-2.5 mb-1 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-900">{plan.title}</h1>
          {daysUntilExam >= 0 && (
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                daysUntilExam <= 3 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {daysUntilExam === 0 ? "Exam today" : daysUntilExam === 1 ? "Exam tomorrow" : `${daysUntilExam} days to exam`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <p className="text-sm text-slate-500">
            Exam on{" "}
            {new Date(plan.exam_date + "T00:00:00").toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {" · "}
            {plan.hours_per_day}h / day
          </p>
          {daysUntilExam >= 0 && daysUntilExam <= 3 && (
            <Link
              href={`/plans/${id}/exam-mode`}
              className="text-sm px-3 py-1.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
            >
              Exam mode →
            </Link>
          )}
        </div>

        {!activeDate && (
          <PlanStats
            daysUntilExam={daysUntilExam}
            completionPct={completionPct}
            topicsRemaining={totalTopics - completedTopics}
            hoursRemaining={hoursRemaining}
            streak={streak}
          />
        )}

        <PlanView
          initialItems={items}
          examDate={plan.exam_date}
          documents={documents ?? []}
          initialDate={activeDate ?? null}
          planId={id}
          isPaid={isPaid}
          initialSelectedItemId={selectedItem ?? null}
        />
      </div>
    </AppLayout>
  );
}
