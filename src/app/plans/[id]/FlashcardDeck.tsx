"use client";

import { useEffect, useState } from "react";

type Card = { id: string; front: string; back: string };

export default function FlashcardDeck({ topicId }: { topicId: string }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/topics/${topicId}/flashcards`)
      .then((r) => (r.ok ? r.json() : { flashcards: [] }))
      .then((data) => active && setCards(data.flashcards ?? []))
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
      const res = await fetch(`/api/topics/${topicId}/flashcards`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Something went wrong");
      else {
        setCards(data.flashcards ?? []);
        setIndex(0);
        setFlipped(false);
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

  if (cards.length === 0) {
    return (
      <div className="mt-2 border border-slate-200 rounded-xl bg-slate-50 p-4 text-center">
        <p className="text-sm text-slate-500 mb-3">No flashcards yet for this topic.</p>
        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
        <button
          onClick={generate}
          disabled={generating}
          className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate flashcards"}
        </button>
      </div>
    );
  }

  const card = cards[index];

  return (
    <div className="mt-2 border border-slate-200 rounded-xl bg-slate-50 p-4">
      <button
        onClick={() => setFlipped((f) => !f)}
        className="w-full min-h-[120px] flex items-center justify-center text-center p-5 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors"
      >
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">
            {flipped ? "Answer" : "Question"}
          </p>
          <p className="text-sm text-slate-800 whitespace-pre-wrap">
            {flipped ? card.back : card.front}
          </p>
          {!flipped && <p className="text-xs text-slate-400 mt-3">Click to flip</p>}
        </div>
      </button>
      <div className="flex items-center justify-between mt-3">
        <button
          onClick={() => {
            setIndex((i) => Math.max(0, i - 1));
            setFlipped(false);
          }}
          disabled={index === 0}
          className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors disabled:opacity-40"
        >
          ← Prev
        </button>
        <span className="text-xs text-slate-400">
          {index + 1} / {cards.length}
        </span>
        <button
          onClick={() => {
            setIndex((i) => Math.min(cards.length - 1, i + 1));
            setFlipped(false);
          }}
          disabled={index === cards.length - 1}
          className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
