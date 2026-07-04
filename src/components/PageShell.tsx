import { Skeleton } from "./Skeleton";
import Logo from "./Logo";

/**
 * Static layout shell used by loading.tsx files.
 * Mirrors AppLayout visually (incl. mobile) without fetching any data.
 */
export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Topbar */}
      <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-border pl-16 pr-6 lg:pl-6">
        <Logo size="sm" />
        <Skeleton className="h-7 w-16 rounded-lg" />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (desktop only, matching the real layout) */}
        <aside className="hidden w-60 flex-shrink-0 flex-col gap-2 border-r border-border bg-slate-50 p-4 lg:flex">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-8 rounded-lg" />
          ))}
        </aside>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  );
}
