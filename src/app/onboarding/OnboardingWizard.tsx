"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COLORS = [
  { value: "blue",   dot: "bg-blue-500" },
  { value: "purple", dot: "bg-purple-500" },
  { value: "green",  dot: "bg-green-500" },
  { value: "orange", dot: "bg-orange-500" },
  { value: "red",    dot: "bg-red-500" },
  { value: "yellow", dot: "bg-yellow-400" },
];

type Topic = { id: string; title: string; difficulty: 1 | 2 | 3 };

const difficultyColor = {
  1: "bg-green-100 text-green-700",
  2: "bg-yellow-100 text-yellow-700",
  3: "bg-red-100 text-red-700",
} as const;
const difficultyLabel = { 1: "Easy", 2: "Medium", 3: "Hard" } as const;

const STEPS = ["Create course", "Upload PDF", "Create plan"];

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 1
  const [courseName, setCourseName] = useState("");
  const [color, setColor] = useState("blue");
  const [courseId, setCourseId] = useState<string | null>(null);
  const [step1Loading, setStep1Loading] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  // Step 2
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "done">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);

  // Step 3
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState("");
  const [examDate, setExamDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("2");
  const [step3Loading, setStep3Loading] = useState(false);
  const [step3Error, setStep3Error] = useState<string | null>(null);

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    setStep1Error(null);
    setStep1Loading(true);
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: courseName, color }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStep1Error(data.error ?? "Something went wrong");
      setStep1Loading(false);
      return;
    }
    setCourseId(data.course.id);
    setStep1Loading(false);
    setStep(1);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !courseId) return;
    setUploadStatus("uploading");
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("course_id", courseId);

    try {
      const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed");
        setUploadStatus("idle");
        return;
      }
      setTopics(data.topics ?? []);
      setUploadStatus("done");
    } catch {
      setUploadError("Network error — please try again");
      setUploadStatus("idle");
    }
    e.target.value = "";
  }

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    setStep3Error(null);
    setStep3Loading(true);
    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course_id: courseId,
        title: courseName,
        start_date: startDate || undefined,
        exam_date: examDate,
        hours_per_day: parseFloat(hoursPerDay),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStep3Error(data.error ?? "Something went wrong");
      setStep3Loading(false);
      return;
    }
    router.push("/calendar");
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                  i < step ? "bg-indigo-600 text-white" :
                  i === step ? "bg-indigo-600 text-white" :
                  "bg-slate-100 text-slate-400"
                }`}>
                  {i < step ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i <= step ? "text-slate-700" : "text-slate-400"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${i < step ? "bg-indigo-600" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 — Create course */}
        {step === 0 && (
          <form onSubmit={handleCreateCourse} className="flex flex-col gap-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Name your first course</h1>
              <p className="text-sm text-slate-400">You can add more courses later.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Course name</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Linear Algebra"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Colour</label>
              <div className="flex gap-2.5">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`w-8 h-8 rounded-full ${c.dot} transition-transform ${
                      color === c.value ? "scale-125 ring-2 ring-offset-2 ring-indigo-400" : "hover:scale-110"
                    }`}
                  />
                ))}
              </div>
            </div>
            {step1Error && <p className="text-sm text-red-600">{step1Error}</p>}
            <button
              type="submit"
              disabled={step1Loading}
              className="bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {step1Loading ? "Creating…" : "Continue →"}
            </button>
          </form>
        )}

        {/* Step 2 — Upload PDF */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Upload your study material</h1>
              <p className="text-sm text-slate-400">Claude will read your PDF and extract topics automatically.</p>
            </div>

            {uploadStatus !== "done" ? (
              <>
                <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  uploadStatus === "uploading" ? "border-slate-200 bg-slate-50 cursor-not-allowed" : "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50"
                }`}>
                  {uploadStatus === "uploading" ? (
                    <div className="flex flex-col items-center gap-2 w-full px-6">
                      <span className="text-xs text-slate-400 mb-1">Extracting topics…</span>
                      {[70, 50, 85, 60, 75].map((w, i) => (
                        <div key={i} className="flex items-center gap-2 w-full">
                          <div className="w-10 h-3 bg-slate-200 rounded-full animate-pulse flex-shrink-0" />
                          <div className="h-2.5 bg-slate-200 rounded animate-pulse" style={{ width: `${w}%` }} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <span className="text-sm font-medium text-slate-600">Click to upload a PDF</span>
                      <span className="text-xs">Max 10 MB</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    disabled={uploadStatus === "uploading"}
                    onChange={handleFileChange}
                  />
                </label>
                {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-sm text-slate-400 hover:text-slate-600 transition-colors text-center"
                >
                  Skip for now →
                </button>
              </>
            ) : (
              <>
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm font-medium text-green-800 mb-3">{topics.length} topics extracted</p>
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                    {topics.map((t) => (
                      <div key={t.id} className="flex items-center gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${difficultyColor[t.difficulty]}`}>
                          {difficultyLabel[t.difficulty]}
                        </span>
                        <span className="text-xs text-slate-700 truncate">{t.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Continue →
                </button>
              </>
            )}
          </div>
        )}

        {/* Step 3 — Create plan */}
        {step === 2 && (
          <form onSubmit={handleCreatePlan} className="flex flex-col gap-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Set up your study plan</h1>
              <p className="text-sm text-slate-400">StudyTool will spread your topics across the available days.</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Start date <span className="text-slate-400 font-normal">(optional — defaults to today)</span>
                </label>
                <input
                  type="date"
                  min={today}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Exam date</label>
                <input
                  type="date"
                  required
                  min={startDate || today}
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Hours per day</label>
                <input
                  type="number"
                  required
                  min="0.5"
                  max="12"
                  step="0.5"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>
            {step3Error && <p className="text-sm text-red-600">{step3Error}</p>}
            <button
              type="submit"
              disabled={step3Loading}
              className="bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {step3Loading ? "Generating plan…" : "Generate my study plan →"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/calendar")}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors text-center"
            >
              Skip — go to calendar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
