import PageShell from "@/components/PageShell";
import { Skeleton } from "@/components/Skeleton";

export default function CalendarLoading() {
  return (
    <PageShell>
      <div className="p-6">
        {/* Week navigation */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-7 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-8 gap-1 mb-1">
          <div />
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-9 rounded-lg" />
          ))}
        </div>

        {/* Course rows */}
        {[...Array(3)].map((_, row) => (
          <div key={row} className="grid grid-cols-8 gap-1 mb-1">
            <Skeleton className="h-12 rounded-lg" />
            {[...Array(7)].map((_, col) => (
              <Skeleton key={col} className={`h-12 rounded-lg ${col === 2 || col === 4 ? "opacity-60" : ""}`} />
            ))}
          </div>
        ))}
      </div>
    </PageShell>
  );
}
