import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";

export const metadata = { title: "How it works — StudyTool" };

const steps = [
  {
    title: "Create a course",
    body: "Add a course for each subject you're studying and give it a colour. Everything — documents, plans, and your AI tutor — is organised per course.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    ),
  },
  {
    title: "Upload your PDFs",
    body: "Drop in lecture slides, textbooks, or notes. Claude reads each PDF and pulls out the topics with a difficulty level and an estimated study time.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
    ),
  },
  {
    title: "Generate a study plan",
    body: "Set your exam date and how many hours a day you can study. StudyTool spreads the topics across your available days — and automatically fits around your other courses.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    ),
  },
  {
    title: "Study day-by-day",
    body: "Open a day to see its topics. Tick them off as you go, and use the study tools on each one — a Summary, an Ask Claude tutor, Flashcards, and a Quiz. (The tutor, flashcards, and quizzes are Premium.)",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
  {
    title: "Track it on the Calendar",
    body: "The Calendar shows every course's plan across the week, colour-coded. Fallen behind? Reschedule overdue topics from today forward with one click.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    ),
  },
];

export default async function TutorialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Send brand-new users to the interactive setup wizard instead.
  const { count } = await supabase
    .from("courses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  const hasCourses = (count ?? 0) > 0;

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl p-6 pb-20">
        {/* Hero */}
        <div className="mb-10 rounded-3xl border border-border bg-brand-gradient-soft p-8 text-center">
          <span className="text-brand-gradient text-sm font-semibold uppercase tracking-wide">How it works</span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            From a pile of PDFs to a clear study plan
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            StudyTool turns your material into a personalised, day-by-day schedule — and helps you actually learn it. Here&apos;s the whole flow in five steps.
          </p>
        </div>

        {/* Steps timeline */}
        <ol className="relative flex flex-col gap-5 before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-px before:bg-border">
          {steps.map((s, i) => (
            <li key={i} className="relative flex gap-5">
              <div className="bg-brand-gradient z-10 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-white shadow-sm">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  {s.icon}
                </svg>
              </div>
              <div className="flex-1 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary">Step {i + 1}</span>
                </div>
                <h2 className="text-base font-semibold text-slate-900">{s.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">Ready to try it?</p>
          <div className="flex gap-3">
            <Button size="lg" className="bg-brand-gradient border-0 hover:opacity-90" render={<Link href={hasCourses ? "/courses/new" : "/onboarding"} />}>
              {hasCourses ? "Create a course" : "Get started"}
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/calendar" />}>
              Go to calendar
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
