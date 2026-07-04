import PageShell from "@/components/PageShell";
import { Skeleton } from "@/components/Skeleton";

export default function CourseLoading() {
  return (
    <PageShell>
      <div className="p-6 pb-16 max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <Skeleton className="h-4 w-28 mb-4" />

        {/* Course header */}
        <div className="flex items-center gap-3 p-4 border border-border rounded-xl mb-8">
          <Skeleton className="w-4 h-4 rounded-full flex-shrink-0" />
          <Skeleton className="h-6 w-48" />
        </div>

        {/* Two columns: plan + documents (left), course tutor (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)] gap-8 items-start">
          <div>
            {/* Study plan section */}
            <Skeleton className="h-5 w-24 mb-3" />
            <Skeleton className="h-16 rounded-xl mb-10" />

            {/* Documents section */}
            <Skeleton className="h-5 w-32 mb-3" />
            <div className="flex flex-col gap-2 mb-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 border border-border rounded-xl">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
            <Skeleton className="h-28 rounded-xl" />
          </div>

          {/* Course tutor panel */}
          <div className="rounded-2xl border border-border p-4">
            <Skeleton className="h-5 w-56 mb-2" />
            <Skeleton className="h-3 w-40 mb-3" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
