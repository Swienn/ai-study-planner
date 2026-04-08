import PageShell from "@/components/PageShell";
import { Skeleton } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <PageShell>
      <div className="p-6 max-w-2xl">
        <Skeleton className="h-8 w-40 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Skeleton className="w-3 h-3 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 rounded-lg mt-1" />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
