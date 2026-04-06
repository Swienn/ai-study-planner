import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import UploadWidget from "./UploadWidget";
import PlanCreator from "./PlanCreator";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: documents }, { data: plans }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, filename, created_at, topics(count)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("plans")
      .select("id, title, exam_date, plan_items(count)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const docs = (documents ?? []).map((d) => ({
    id: d.id,
    filename: d.filename,
    topic_count: (d.topics as unknown as { count: number }[])[0]?.count ?? 0,
  }));

  const planList = (plans ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    exam_date: p.exam_date,
    item_count: (p.plan_items as unknown as { count: number }[])[0]?.count ?? 0,
  }));

  return (
    <main className="flex flex-col items-center min-h-screen p-8">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user.email}</span>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        {/* Study plans */}
        {planList.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-3">Your plans</h2>
            <div className="flex flex-col gap-2">
              {planList.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/plans/${plan.id}`}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{plan.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Exam{" "}
                      {new Date(plan.exam_date + "T00:00:00").toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {" · "}
                      {plan.item_count} topics
                    </p>
                  </div>
                  <span className="text-gray-400 text-sm">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Documents */}
        {docs.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-3">Documents</h2>
            <div className="flex flex-col gap-3">
              {docs.map((doc) => (
                <div key={doc.id} className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{doc.filename}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {doc.topic_count} topics extracted
                      </p>
                    </div>
                    <PlanCreator document={doc} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upload */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Upload material</h2>
          <UploadWidget />
        </section>

      </div>
    </main>
  );
}
