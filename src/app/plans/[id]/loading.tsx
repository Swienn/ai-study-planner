import PageShell from "@/components/PageShell";
import { Skeleton } from "@/components/Skeleton";

export default function PlanLoading() {
  return (
    <PageShell>
      <div className="p-6 pb-16 max-w-6xl mx-auto">
        {/* Breadcrumb + header */}
        <Skeleton className="h-4 w-24 mb-4" />
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-4 w-64 mb-8" />

        {/* Two columns: topic list + study panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] gap-6 items-start">
          <div>
            <div className="mb-5">
              <div className="flex justify-between mb-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="h-2.5 rounded-full" />
            </div>
            <div className="flex flex-col gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-4 border border-border rounded-xl">
                  <Skeleton className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex gap-2">
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-12 rounded-full flex-shrink-0" />
                    </div>
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Study panel */}
          <div className="rounded-2xl border border-border p-4">
            <Skeleton className="h-5 w-40 mb-3" />
            <Skeleton className="h-9 rounded-xl mb-3" />
            <Skeleton className="h-44 rounded-xl" />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
