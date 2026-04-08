import PageShell from "@/components/PageShell";
import { Skeleton } from "@/components/Skeleton";

export default function PlanLoading() {
  return (
    <PageShell>
      <div className="p-6 max-w-2xl">
        {/* Breadcrumb */}
        <Skeleton className="h-4 w-24 mb-4" />

        {/* Plan title */}
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-4 w-40 mb-8" />

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-2.5 rounded-full" />
        </div>

        {/* Day group */}
        <Skeleton className="h-4 w-20 mb-3" />
        <div className="flex flex-col gap-2">
          {["w-full", "w-3/4", "w-11/12", "w-3/5", "w-5/6"].map((w, i) => (
            <div key={i} className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl">
              <Skeleton className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex gap-2">
                  <Skeleton className={`h-4 flex-1 ${w}`} />
                  <Skeleton className="h-4 w-12 rounded-full flex-shrink-0" />
                </div>
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
