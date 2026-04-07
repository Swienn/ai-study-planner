import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AppTopBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white flex-shrink-0 z-10">
      <Link href="/calendar" className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
        </div>
        <span className="font-bold text-slate-900 text-base tracking-tight">
          StudyPlanner
        </span>
      </Link>

      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-slate-400 hidden sm:block">
            {user.email}
          </span>
        )}
        <Link
          href="/dashboard"
          className="text-sm text-slate-500 hover:text-slate-800 transition-colors hidden sm:block"
        >
          Manage
        </Link>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
