import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppLayout from "@/components/AppLayout";
import ExamModeClient from "./ExamModeClient";
import { daysUntil } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export default async function ExamModePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: plan } = await supabase
    .from("plans")
    .select("id, title, exam_date")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!plan) notFound();

  const { data: planDocs } = await supabase
    .from("plan_documents")
    .select("document_id")
    .eq("plan_id", id);
  const docIds = (planDocs ?? []).map((d) => d.document_id);

  const { data: topics } =
    docIds.length > 0
      ? await supabase
          .from("topics")
          .select("id, title, summary, study_guide")
          .in("document_id", docIds)
          .order("position")
      : { data: [] as { id: string; title: string; summary: string; study_guide: string | null }[] };

  const days = daysUntil(plan.exam_date);

  return (
    <AppLayout activePlanId={id}>
      <div className="p-6 pb-16 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href={`/plans/${id}`} className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
            ← Back to plan
          </Link>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
            {days < 0 ? "Exam passed" : days === 0 ? "Exam today" : days === 1 ? "Exam tomorrow" : `${days} days to exam`}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-1">Exam mode — {plan.title}</h1>
        <p className="text-sm text-slate-500 mb-8">
          Condensed, high-yield revision notes for every topic. Perfect for a final review.
        </p>

        <ExamModeClient planId={id} initialTopics={(topics ?? []).map((t) => ({
          id: t.id,
          title: t.title,
          summary: t.summary,
          study_guide: t.study_guide,
        }))} />
      </div>
    </AppLayout>
  );
}
