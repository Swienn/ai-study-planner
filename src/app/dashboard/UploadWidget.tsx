"use client";

import { useState } from "react";

type Topic = {
  id: string;
  title: string;
  summary: string;
  difficulty: 1 | 2 | 3;
  position: number;
};

type UploadResult = {
  document: { id: string; filename: string };
  topics: Topic[];
};

const difficultyLabel = { 1: "Easy", 2: "Medium", 3: "Hard" } as const;
const difficultyColor = {
  1: "bg-green-100 text-green-700",
  2: "bg-yellow-100 text-yellow-700",
  3: "bg-red-100 text-red-700",
} as const;

export default function UploadWidget() {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
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

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setStatus("error");
        return;
      }

      setResult(data);
      setStatus("done");
    } catch {
      setError("Network error — please try again");
      setStatus("error");
    }

    // Reset input so the same file can be re-uploaded after an error
    e.target.value = "";
  }

  return (
    <div className="w-full max-w-xl mt-8">
      <h2 className="text-lg font-semibold mb-3">Upload study material</h2>

      <label
        className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors
          ${status === "uploading"
            ? "border-gray-300 bg-gray-50 cursor-not-allowed"
            : "border-gray-300 hover:border-black hover:bg-gray-50"
          }`}
      >
        {status === "uploading" ? (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm">Extracting topics…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-sm font-medium text-gray-600">Click to upload a PDF</span>
            <span className="text-xs">Max 10 MB</span>
          </div>
        )}
        <input
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          disabled={status === "uploading"}
          onChange={handleFileChange}
        />
      </label>

      {status === "error" && error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      {status === "done" && result && (
        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-3">
            <span className="font-medium text-black">{result.document.filename}</span>
            {" — "}{result.topics.length} topics extracted
          </p>
          <ul className="flex flex-col gap-3">
            {result.topics
              .sort((a, b) => a.position - b.position)
              .map((topic) => (
                <li key={topic.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-medium text-sm">{topic.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${difficultyColor[topic.difficulty]}`}>
                      {difficultyLabel[topic.difficulty]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{topic.summary}</p>
                </li>
              ))}
          </ul>
          <button
            onClick={() => { setStatus("idle"); setResult(null); }}
            className="mt-4 text-sm text-gray-500 hover:text-black underline"
          >
            Upload another document
          </button>
        </div>
      )}
    </div>
  );
}
