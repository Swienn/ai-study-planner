// Presentational analytics tiles for a plan (Phase 8.3). Server component.

function Tile({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: string }) {
  return (
    <div className="flex-1 min-w-[120px] p-4 border border-slate-200 rounded-xl bg-white">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${accent ?? "text-slate-900"}`}>{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

export default function PlanStats({
  daysUntilExam,
  completionPct,
  topicsRemaining,
  hoursRemaining,
  streak,
}: {
  daysUntilExam: number;
  completionPct: number;
  topicsRemaining: number;
  hoursRemaining: number;
  streak: number;
}) {
  const examValue =
    daysUntilExam < 0 ? "Passed" : daysUntilExam === 0 ? "Today" : daysUntilExam === 1 ? "Tomorrow" : `${daysUntilExam} days`;
  const examAccent = daysUntilExam >= 0 && daysUntilExam <= 3 ? "text-red-600" : "text-slate-900";

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      <Tile label="Exam in" value={examValue} accent={examAccent} />
      <Tile label="Complete" value={`${completionPct}%`} accent="text-indigo-600" />
      <Tile
        label="Left to study"
        value={`${hoursRemaining}h`}
        hint={`${topicsRemaining} topic${topicsRemaining === 1 ? "" : "s"}`}
      />
      <Tile
        label="Study streak"
        value={streak === 0 ? "—" : `${streak} day${streak === 1 ? "" : "s"}`}
        accent={streak > 0 ? "text-amber-600" : "text-slate-400"}
      />
    </div>
  );
}
