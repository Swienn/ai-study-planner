import PageShell from "@/components/PageShell";
import { Skeleton } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <PageShell>
      <div className="p-6 pb-16 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-40 mb-8" />

        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border border-border rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-3 h-3 rounded-full flex-shrink-0" />
                <Skeleton className="h-4 flex-1" />
              </div>
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
