"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Topic = { id: string; title: string; summary: string; difficulty: 1 | 2 | 3 };
type UploadResult = { document: { id: string; filename: string }; topics: Topic[] };

const difficultyColor = {
  1: "bg-green-100 text-green-700",
  2: "bg-yellow-100 text-yellow-700",
  3: "bg-red-100 text-red-700",
} as const;

const difficultyLabel = { 1: "Easy", 2: "Medium", 3: "Hard" } as const;

export default function CourseUploadWidget({ courseId }: { courseId: string }) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("course_id", courseId);

    try {
      const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Upload failed"); setStatus("error"); return; }
      setResult(data);
      setStatus("done");
      router.refresh(); // refresh server component so document list updates
    } catch {
      setError("Network error — please try again");
      setStatus("error");
    }
    e.target.value = "";
  }

  return (
    <div className="mt-4">
      <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors
        ${status === "uploading" ? "border-gray-300 bg-gray-50 cursor-not-allowed" : "border-gray-300 hover:border-black hover:bg-gray-50"}`}>
        {status === "uploading" ? (
          <div className="flex items-center gap-2 text-gray-400">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm">Extracting topics…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-sm font-medium text-gray-600">Add a PDF</span>
            <span className="text-xs">Max 10 MB</span>
          </div>
        )}
        <input type="file" accept=".pdf,application/pdf" className="hidden" disabled={status === "uploading"} onChange={handleFileChange} />
      </label>

      {status === "error" && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {status === "done" && result && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium mb-2">{result.document.filename} — {result.topics.length} topics</p>
          <div className="flex flex-col gap-1.5">
            {result.topics.map((t) => (
              <div key={t.id} className="flex items-center gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${difficultyColor[t.difficulty]}`}>
                  {difficultyLabel[t.difficulty]}
                </span>
                <span className="text-xs text-gray-700">{t.title}</span>
              </div>
            ))}
          </div>
          <button onClick={() => { setStatus("idle"); setResult(null); }} className="mt-2 text-xs text-gray-400 hover:text-black underline">
            Add another PDF
          </button>
        </div>
      )}
    </div>
  );
}
