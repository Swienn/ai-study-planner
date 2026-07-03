import Link from "next/link";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Upload anything",
    body: "Drop in lecture slides, textbooks, or notes. Claude reads each PDF and pulls out the topics with difficulty and time estimates.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
    ),
  },
  {
    title: "Conflict-aware schedule",
    body: "Pick your exam date and daily hours. StudyTool spreads the work across your days — and automatically fits around your other courses.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    ),
  },
  {
    title: "Study smarter",
    body: "Each topic gets an AI summary, plus flashcards, quizzes, and a tutor you can ask anything — right where you're studying.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    ),
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="bg-brand-gradient-soft pointer-events-none absolute inset-0 -z-10" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_40%_at_50%_0%,rgba(139,92,246,0.12),transparent)]" />

      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo size="md" />
        <div className="flex items-center gap-2">
          <Button variant="ghost" render={<Link href="/login" />}>Log in</Button>
          <Button className="bg-brand-gradient border-0 hover:opacity-90" render={<Link href="/signup" />}>
            Sign up
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pb-16 pt-16 text-center sm:pt-24">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Turn your PDFs into a{" "}
          <span className="text-brand-gradient">day-by-day study plan</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-500">
          Upload your material, set your exam date, and get a clear, personalised schedule in minutes —
          with AI summaries, flashcards, and quizzes for every topic.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button size="lg" className="bg-brand-gradient border-0 hover:opacity-90" render={<Link href="/signup" />}>
            Get started free
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/login" />}>
            Log in
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto grid max-w-5xl gap-5 px-6 pb-24 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border border-border bg-white/70 p-6 backdrop-blur-sm">
            <div className="bg-brand-gradient mb-4 flex h-11 w-11 items-center justify-center rounded-xl">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                {f.icon}
              </svg>
            </div>
            <h3 className="mb-1.5 font-semibold text-slate-900">{f.title}</h3>
            <p className="text-sm leading-relaxed text-slate-500">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 pb-10 text-xs text-slate-400">
        <span>© {new Date().getFullYear()} StudyTool</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-slate-600">Privacy</Link>
          <Link href="/terms" className="hover:text-slate-600">Terms</Link>
        </div>
      </footer>
    </main>
  );
}
