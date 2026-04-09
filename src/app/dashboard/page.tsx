import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppLayout from "@/components/AppLayout";
import UploadWidget from "./UploadWidget";
import PlanCreator from "./PlanCreator";
import DeleteDocumentButton from "../courses/[id]/DeleteDocumentButton";

const colorDot: Record<string, string> = {
  red: "bg-red-500", orange: "bg-orange-500", yellow: "bg-yellow-400",
  green: "bg-green-500", blue: "bg-blue-500", purple: "bg-purple-500",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: courses }, { data: uncategorisedDocs }, { data: plans }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, color, created_at, documents(count), plans(id, exam_date)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("documents")
      .select("id, filename, topics(count)")
      .eq("user_id", user.id)
      .is("course_id", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("plans")
      .select("id, title, exam_date, plan_items(count)")
      .eq("user_id", user.id)
      .is("course_id", null)
      .order("created_at", { ascending: false }),
  ]);

  const courseList = (courses ?? []).map(c => ({
    id: c.id,
    title: c.title,
    color: c.color,
    doc_count: (c.documents as unknown as { count: number }[])[0]?.count ?? 0,
    plan: (c.plans as unknown as { id: string; exam_date: string }[])[0] ?? null,
  }));

  const looseDocs = (uncategorisedDocs ?? []).map(d => ({
    id: d.id,
    filename: d.filename,
    topic_count: (d.topics as unknown as { count: number }[])[0]?.count ?? 0,
  }));

  const loosePlans = (plans ?? []).map(p => ({
    id: p.id,
    title: p.title,
    exam_date: p.exam_date,
    item_count: (p.plan_items as unknown as { count: number }[])[0]?.count ?? 0,
  }));

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Manage courses</h1>

        {/* Courses */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Courses</h2>
            <Link
              href="/courses/new"
              className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
            >
              + New course
            </Link>
          </div>

          {courseList.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <p className="font-medium text-slate-700 mb-1">No courses yet</p>
              <p className="text-sm text-slate-400 mb-4">Create a course for each subject you&apos;re studying</p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Get started →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {courseList.map(course => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${colorDot[course.color] ?? "bg-blue-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-800">{course.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {course.doc_count} {course.doc_count === 1 ? "document" : "documents"}
                      {course.plan && (
                        <> · Exam {new Date(course.plan.exam_date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</>
                      )}
                    </p>
                  </div>
                  <span className="text-slate-400 text-sm">→</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Legacy: uncategorised plans */}
        {loosePlans.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Other plans</h2>
            <div className="flex flex-col gap-2">
              {loosePlans.map(plan => (
                <Link
                  key={plan.id}
                  href={`/plans/${plan.id}`}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  <div>
                    <p className="font-medium text-sm text-slate-800">{plan.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Exam {new Date(plan.exam_date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}{plan.item_count} topics
                    </p>
                  </div>
                  <span className="text-slate-400 text-sm">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Legacy: uncategorised documents */}
        {looseDocs.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Uncategorised documents</h2>
            <p className="text-xs text-slate-400 mb-4">These were uploaded before courses. Create a plan or move them to a course.</p>
            <div className="flex flex-col gap-3">
              {looseDocs.map(doc => (
                <div key={doc.id} className="p-4 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-slate-800">{doc.filename}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{doc.topic_count} topics</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <PlanCreator document={doc} />
                      <DeleteDocumentButton documentId={doc.id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick upload — only show if no courses */}
        {courseList.length === 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">Upload material</h2>
            <UploadWidget />
          </section>
        )}
      </div>
    </AppLayout>
  );
}
