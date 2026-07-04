"use client";

import { useEffect, useState } from "react";

type Question = { id: string; question: string; options: string[] };
type Result = { id: string; correct_index: number; selected: number | null; correct: boolean };

export default function Quiz({ topicId }: { topicId: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Record<string, Result> | null>(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
        setResults(null);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setGenerating(false);
    }
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/topics/${topicId}/quiz/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't score the quiz");
        return;
      }
      const map: Record<string, Result> = {};
      for (const r of (data.results ?? []) as Result[]) map[r.id] = r;
      setResults(map);
      setScore(data.score ?? 0);
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
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
          className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate quiz"}
        </button>
      </div>
    );
  }

  const submitted = results !== null;
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="mt-2 border border-slate-200 rounded-xl bg-slate-50 p-4 flex flex-col gap-4">
      {questions.map((q, qi) => {
        const res = results?.[q.id];
        return (
          <div key={q.id}>
            <p className="text-sm font-medium text-slate-800 mb-2">
              {qi + 1}. {q.question}
            </p>
            <div className="flex flex-col gap-1.5">
              {q.options.map((opt, oi) => {
                const selected = answers[q.id] === oi;
                const isCorrect = res ? res.correct_index === oi : false;
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
        );
      })}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {submitted ? (
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">
            You scored {score} / {questions.length}
          </p>
          <button
            onClick={() => {
              setResults(null);
              setAnswers({});
            }}
            className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <button
          onClick={submit}
          disabled={!allAnswered || submitting}
          className="self-start text-sm px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? "Scoring…" : "Submit answers"}
        </button>
      )}
    </div>
  );
}
