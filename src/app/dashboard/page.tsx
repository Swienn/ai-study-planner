import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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
    <main className="flex flex-col items-center min-h-screen p-8">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-3">
            <Link href="/calendar" className="text-sm text-gray-500 hover:text-black transition-colors">
              📅 Calendar
            </Link>
            <span className="text-sm text-gray-400">{user.email}</span>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>

        {/* Courses */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Courses</h2>
            <Link
              href="/courses/new"
              className="text-sm px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              + New course
            </Link>
          </div>

          {courseList.length === 0 ? (
            <p className="text-sm text-gray-400">No courses yet. Create one to group your study material.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {courseList.map(course => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${colorDot[course.color] ?? "bg-blue-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{course.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {course.doc_count} {course.doc_count === 1 ? "document" : "documents"}
                      {course.plan && (
                        <> · Exam {new Date(course.plan.exam_date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</>
                      )}
                    </p>
                  </div>
                  <span className="text-gray-400 text-sm">→</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Legacy: uncategorised plans */}
        {loosePlans.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-3">Other plans</h2>
            <div className="flex flex-col gap-2">
              {loosePlans.map(plan => (
                <Link
                  key={plan.id}
                  href={`/plans/${plan.id}`}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{plan.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Exam {new Date(plan.exam_date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}{plan.item_count} topics
                    </p>
                  </div>
                  <span className="text-gray-400 text-sm">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Legacy: uncategorised documents */}
        {looseDocs.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-3">Uncategorised documents</h2>
            <p className="text-xs text-gray-400 mb-3">These were uploaded before courses. Create a plan or move them to a course.</p>
            <div className="flex flex-col gap-3">
              {looseDocs.map(doc => (
                <div key={doc.id} className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{doc.filename}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{doc.topic_count} topics</p>
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

        {/* Quick upload (uncategorised) — only show if no courses */}
        {courseList.length === 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Upload material</h2>
            <UploadWidget />
          </section>
        )}

      </div>
    </main>
  );
}
