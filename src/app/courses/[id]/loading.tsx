import PageShell from "@/components/PageShell";
import { Skeleton } from "@/components/Skeleton";

export default function CourseLoading() {
  return (
    <PageShell>
      <div className="p-6 max-w-2xl">
        {/* Breadcrumb */}
        <Skeleton className="h-4 w-28 mb-4" />

        {/* Course header */}
        <div className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl mb-8">
          <Skeleton className="w-4 h-4 rounded-full flex-shrink-0" />
          <Skeleton className="h-6 w-48" />
        </div>

        {/* Study plan section */}
        <Skeleton className="h-5 w-24 mb-3" />
        <Skeleton className="h-16 rounded-xl mb-8" />

        {/* Documents section */}
        <Skeleton className="h-5 w-24 mb-3" />
        <div className="flex flex-col gap-2 mb-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 border border-slate-200 rounded-xl">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-28 rounded-xl" />
      </div>
    </PageShell>
  );
}
