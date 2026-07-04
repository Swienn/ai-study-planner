import PageShell from "@/components/PageShell";
import { Skeleton } from "@/components/Skeleton";

const GRID = { gridTemplateColumns: "180px repeat(7, 1fr)" } as React.CSSProperties;

export default function CalendarLoading() {
  return (
    <PageShell>
      <div className="p-6 pb-16">
        {/* Week navigation */}
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="ml-auto">
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
        </div>

        <div className="overflow-x-auto p-1.5">
          <div className="min-w-[640px]">
            {/* Day headers */}
            <div className="grid gap-1.5 mb-2" style={GRID}>
              <div />
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-11 rounded-xl" />
              ))}
            </div>

            {/* Course rows */}
            {[...Array(3)].map((_, row) => (
              <div key={row} className="grid gap-1.5 mb-2" style={GRID}>
                <div className="flex items-center px-3">
                  <Skeleton className="h-4 w-24" />
                </div>
                {[...Array(7)].map((_, col) => (
                  <Skeleton key={col} className={`h-[84px] rounded-xl ${col < 3 ? "opacity-50" : ""}`} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
