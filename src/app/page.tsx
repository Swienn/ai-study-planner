import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 text-center bg-white">
      <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-2">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-slate-900">StudyTool</h1>
      <p className="text-lg text-slate-500 max-w-md">
        Upload your study material, set your exam date, and get a clear
        day-by-day study schedule in minutes.
      </p>
      <div className="flex gap-3">
        <Link
          href="/signup"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
