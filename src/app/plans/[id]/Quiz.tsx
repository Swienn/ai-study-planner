"use client";

import { useEffect, useState } from "react";

type Question = { id: string; question: string; options: string[]; correct_index: number };

export default function Quiz({ topicId }: { topicId: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/topics/${topicId}/quiz`)
      .then((r) => (r.ok ? r.json() : { questions: [] }))
      .then((data) => active && setQuestions(data.questions ?? []))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [topicId]);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/topics/${topicId}/quiz`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Something went wrong");
      else {
        setQuestions(data.questions ?? []);
        setAnswers({});
        setSubmitted(false);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return <div className="mt-2 p-4 text-sm text-slate-400 text-center">Loading…</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="mt-2 border border-slate-200 rounded-xl bg-slate-50 p-4 text-center">
        <p className="text-sm text-slate-500 mb-3">No quiz yet for this topic.</p>
        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
        <button
          onClick={generate}
          disabled={generating}
          className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate quiz"}
        </button>
      </div>
    );
  }

  const score = questions.reduce((n, q) => (answers[q.id] === q.correct_index ? n + 1 : n), 0);
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="mt-2 border border-slate-200 rounded-xl bg-slate-50 p-4 flex flex-col gap-4">
      {questions.map((q, qi) => (
        <div key={q.id}>
          <p className="text-sm font-medium text-slate-800 mb-2">
            {qi + 1}. {q.question}
          </p>
          <div className="flex flex-col gap-1.5">
            {q.options.map((opt, oi) => {
              const selected = answers[q.id] === oi;
              const isCorrect = q.correct_index === oi;
              let style = "border-slate-200 bg-white text-slate-700 hover:border-slate-300";
              if (submitted) {
                if (isCorrect) style = "border-green-400 bg-green-50 text-green-800";
                else if (selected) style = "border-red-300 bg-red-50 text-red-700";
                else style = "border-slate-200 bg-white text-slate-400";
              } else if (selected) {
                style = "border-indigo-400 bg-indigo-50 text-indigo-800";
              }
              return (
                <button
                  key={oi}
                  disabled={submitted}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                  className={`text-left text-sm px-3 py-2 rounded-lg border transition-colors ${style}`}
                >
                  {opt}
                  {submitted && isCorrect && <span className="ml-2">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {submitted ? (
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">
            You scored {score} / {questions.length}
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setAnswers({});
            }}
            className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <button
          onClick={() => setSubmitted(true)}
          disabled={!allAnswered}
          className="self-start text-sm px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          Submit answers
        </button>
      )}
    </div>
  );
}
