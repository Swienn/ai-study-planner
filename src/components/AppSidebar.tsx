import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import SidebarClient from "./SidebarClient";

export type SidebarCourse = {
  id: string;
  title: string;
  color: string;
  plan: {
    id: string;
    dates: string[];
  } | null;
};

export default async function AppSidebar({
  activePlanId,
  activeDate,
}: {
  activePlanId?: string;
  activeDate?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: courses }, { data: plans }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, color")
      .eq("user_id", user.id)
      .order("created_at"),
    supabase
      .from("plans")
      .select("id, course_id")
      .eq("user_id", user.id)
      .not("course_id", "is", null),
  ]);

  const planIds = (plans ?? []).map((p) => p.id);
  const datesByPlan: Record<string, string[]> = {};

  if (planIds.length > 0) {
    const { data: planItems } = await supabase
      .from("plan_items")
      .select("plan_id, date")
      .in("plan_id", planIds)
      .order("date");

    for (const item of planItems ?? []) {
      if (!datesByPlan[item.plan_id]) datesByPlan[item.plan_id] = [];
      if (!datesByPlan[item.plan_id].includes(item.date)) {
        datesByPlan[item.plan_id].push(item.date);
      }
    }
  }

  const sidebarCourses: SidebarCourse[] = (courses ?? []).map((course) => {
    const plan = (plans ?? []).find((p) => p.course_id === course.id) ?? null;
    return {
      id: course.id,
      title: course.title,
      color: course.color,
      plan: plan
        ? {
            id: plan.id,
            dates: datesByPlan[plan.id] ?? [],
          }
        : null,
    };
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <SidebarClient
          courses={sidebarCourses}
          activePlanId={activePlanId}
          activeDate={activeDate}
        />
      </div>
      <div className="p-3 border-t border-slate-200 flex flex-col gap-1">
        <Link
          href="/courses/new"
          className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors font-medium"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New course
        </Link>
      </div>
    </div>
  );
}
