import { Skeleton } from "./Skeleton";

/**
 * Static layout shell used by loading.tsx files.
 * Mirrors AppLayout visually without fetching any data.
 */
export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Topbar */}
      <header className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 text-base tracking-tight">StudyTool</span>
        </div>
        <Skeleton className="w-16 h-7 rounded-lg" />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 border-r border-slate-200 flex-shrink-0 bg-slate-50 p-4 flex flex-col gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-8 rounded-lg" />
          ))}
        </aside>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
