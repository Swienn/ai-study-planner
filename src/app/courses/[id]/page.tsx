import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
import AppLayout from "@/components/AppLayout";
import CourseUploadWidget from "./CourseUploadWidget";
import CoursePlanCreator from "./CoursePlanCreator";
import DeleteCourseButton from "./DeleteCourseButton";
import DeleteDocumentButton from "./DeleteDocumentButton";

const colorDot: Record<string, string> = {
  red: "bg-red-500", orange: "bg-orange-500", yellow: "bg-yellow-400",
  green: "bg-green-500", blue: "bg-blue-500", purple: "bg-purple-500",
};

const colorBorder: Record<string, string> = {
  red: "border-red-200 bg-red-50",
  orange: "border-orange-200 bg-orange-50",
  yellow: "border-yellow-200 bg-yellow-50",
  green: "border-green-200 bg-green-50",
  blue: "border-blue-200 bg-blue-50",
  purple: "border-purple-200 bg-purple-50",
};

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, color")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!course) notFound();

  const [{ data: documents }, { data: plan }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, filename, created_at, topics(count)")
      .eq("course_id", id)
      .order("created_at"),
    supabase
      .from("plans")
      .select("id, title, exam_date, hours_per_day")
      .eq("course_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const docs = (documents ?? []).map((d) => ({
    id: d.id,
    filename: d.filename,
    topic_count: (d.topics as unknown as { count: number }[])[0]?.count ?? 0,
  }));

  const totalTopics = docs.reduce((sum, d) => sum + d.topic_count, 0);
  const dot = colorDot[course.color] ?? "bg-blue-500";
  const headerBg = colorBorder[course.color] ?? colorBorder.blue;

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl">
        {/* Breadcrumb */}
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-700 transition-colors mb-4 inline-block">
          ← Manage courses
        </Link>

        {/* Course header */}
        <div className={`flex items-center justify-between p-4 rounded-xl border mb-8 ${headerBg}`}>
          <div className="flex items-center gap-3">
            <span className={`w-4 h-4 rounded-full flex-shrink-0 ${dot}`} />
            <h1 className="text-xl font-bold text-slate-900">{course.title}</h1>
          </div>
          <DeleteCourseButton courseId={course.id} />
        </div>

        {/* Study plan */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Study plan</h2>
          {totalTopics === 0 && !plan ? (
            <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-slate-500">Upload at least one PDF first — Claude will extract topics and then you can create a study plan.</p>
            </div>
          ) : (
            <CoursePlanCreator
              courseId={course.id}
              courseTitle={course.title}
              existingPlan={plan ?? null}
            />
          )}
        </section>

        {/* Documents */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-800">
              Documents
              {docs.length > 0 && (
                <span className="text-slate-400 font-normal text-base ml-2">
                  ({totalTopics} topics total)
                </span>
              )}
            </h2>
          </div>

          {docs.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl mb-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <p className="font-medium text-slate-700 mb-1">No documents yet</p>
              <p className="text-sm text-slate-400 mb-4">Upload a PDF and Claude will extract the topics for you</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mb-4">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between px-4 py-3 border border-slate-200 rounded-xl bg-white"
                >
                  <span className="text-sm font-medium text-slate-800 truncate mr-4">
                    {doc.filename}
                  </span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-slate-400">{doc.topic_count} topics</span>
                    <DeleteDocumentButton documentId={doc.id} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <CourseUploadWidget courseId={course.id} />
        </section>
      </div>
    </AppLayout>
  );
}
