import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppLayout from "@/components/AppLayout";
import PlanView from "./PlanView";

export const dynamic = "force-dynamic";
import DeletePlanButton from "./DeletePlanButton";

export default async function PlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { id } = await params;
  const { date: activeDate } = await searchParams;

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
    .select("id, date, status, topics(id, title, summary, difficulty, document_id)")
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
  };

  const items = (rawItems ?? []).map((item) => {
    const t = (
      Array.isArray(item.topics) ? item.topics[0] : item.topics
    ) as TopicRow | null;
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

  return (
    <AppLayout activePlanId={id} activeDate={activeDate}>
      <div className="p-6 max-w-2xl">
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
        <h1 className="text-2xl font-bold text-slate-900 mb-1">{plan.title}</h1>
        <p className="text-sm text-slate-500 mb-8">
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

        <PlanView
          initialItems={items}
          examDate={plan.exam_date}
          documents={documents ?? []}
          initialDate={activeDate ?? null}
          planId={id}
        />
      </div>
    </AppLayout>
  );
}
