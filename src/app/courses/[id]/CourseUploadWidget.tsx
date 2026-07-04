"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UpgradeBanner from "@/components/UpgradeBanner";

type Topic = { id: string; title: string; summary: string; difficulty: 1 | 2 | 3 };
type UploadResult = { document: { id: string; filename: string }; topics: Topic[] };

const difficultyColor = {
  1: "bg-green-100 text-green-700",
  2: "bg-yellow-100 text-yellow-700",
  3: "bg-red-100 text-red-700",
} as const;

const difficultyLabel = { 1: "Easy", 2: "Medium", 3: "Hard" } as const;

export default function CourseUploadWidget({
  courseId,
  docIds,
}: {
  courseId: string;
  docIds: string[];
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [limitHit, setLimitHit] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setError(null);
    setLimitHit(false);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("course_id", courseId);

    try {
      const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) setLimitHit(true);
        setError(data.error ?? "Upload failed");
        setStatus("error");
        return;
      }
      setResult(data);
      setStatus("done");
      router.refresh();
    } catch {
      setError("Network error — please try again");
      setStatus("error");
    }
    e.target.value = "";
  }

  return (
    <div className="mt-4">
      <label className={`flex flex-col items-center justify-center w-full min-h-28 py-4 px-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors
        ${status === "uploading" || limitHit ? "border-border bg-muted/40 cursor-not-allowed" : "border-border hover:border-primary/60 hover:bg-accent"}`}>
        {status === "uploading" ? (
          <div className="flex flex-col items-center gap-1.5 w-full">
            <span className="text-xs text-muted-foreground mb-2">Extracting topics…</span>
            {[70, 50, 85, 60].map((w, i) => (
              <div key={i} className="flex items-center gap-2 w-full">
                <div className="w-10 h-4 bg-slate-200 rounded-full animate-pulse flex-shrink-0" />
                <div
                  className="h-3 bg-slate-200 rounded animate-pulse"
                  style={{ width: `${w}%` } as React.CSSProperties}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-sm font-medium text-slate-600">Add a PDF</span>
            <span className="text-xs">Max 10 MB</span>
          </div>
        )}
        <input
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          disabled={status === "uploading" || limitHit}
          onChange={handleFileChange}
        />
      </label>

      {status === "error" && limitHit && error ? (
        <div className="mt-2">
          <UpgradeBanner message={error} />
        </div>
      ) : status === "error" && error ? (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      ) : null}

      {/* Only show the just-uploaded preview while its document still exists.
          When the doc is removed, the server refresh drops it from docIds and
          the preview clears too — otherwise the topics linger until a manual
          page refresh. */}
      {status === "done" && result && docIds.includes(result.document.id) && (
        <div className="mt-4 p-3 bg-muted/40 rounded-xl border border-border">
          <p className="text-sm font-medium mb-2 text-slate-800">{result.document.filename} — {result.topics.length} topics</p>
          <div className="flex flex-col gap-1.5">
            {result.topics.map((t) => (
              <div key={t.id} className="flex items-center gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${difficultyColor[t.difficulty]}`}>
                  {difficultyLabel[t.difficulty]}
                </span>
                <span className="text-xs text-slate-700">{t.title}</span>
              </div>
            ))}
          </div>
          <button onClick={() => { setStatus("idle"); setResult(null); }} className="mt-2 text-xs text-muted-foreground hover:text-slate-900 underline">
            Add another PDF
          </button>
        </div>
      )}
    </div>
  );
}
