import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PlanView from "./PlanView";

export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: plan } = await supabase
    .from("plans")
    .select("id, title, exam_date, hours_per_day")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!plan) notFound();

  const { data: items } = await supabase
    .from("plan_items")
    .select("id, date, status, topics(id, title, summary, difficulty)")
    .eq("plan_id", id)
    .order("date");

  return (
    <main className="flex flex-col items-center min-h-screen p-8">
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-1">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-black">
            ← Dashboard
          </Link>
          <span className="text-sm text-gray-400">
            {plan.hours_per_day}h / day
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-1">{plan.title}</h1>
        <p className="text-sm text-gray-500 mb-8">
          Exam on{" "}
          {new Date(plan.exam_date + "T00:00:00").toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        <PlanView
          initialItems={(items ?? []).map((item) => ({
            ...item,
            topics: Array.isArray(item.topics) ? item.topics[0] : item.topics,
          }))}
          examDate={plan.exam_date}
        />
      </div>
    </main>
  );
}
