"use client";

import { useState } from "react";
import Link from "next/link";
import TopicSummary from "./TopicSummary";
import ChatBox from "@/components/ChatBox";
import FlashcardDeck from "./FlashcardDeck";
import Quiz from "./Quiz";

type Tab = "summary" | "chat" | "flashcards" | "quiz";

const TABS: { key: Tab; label: string; paid: boolean }[] = [
  { key: "summary", label: "Summary", paid: false },
  { key: "chat", label: "Ask Claude", paid: true },
  { key: "flashcards", label: "Flashcards", paid: true },
  { key: "quiz", label: "Quiz", paid: true },
];

const difficultyLabel = { 1: "Easy", 2: "Medium", 3: "Hard" } as const;
const difficultyColor = {
  1: "bg-green-100 text-green-700",
  2: "bg-yellow-100 text-yellow-700",
  3: "bg-red-100 text-red-700",
} as const;

export type PanelTopic = { id: string; title: string; summary: string; difficulty: 1 | 2 | 3 };

export default function TopicStudyPanel({ topic, isPaid }: { topic: PanelTopic; isPaid: boolean }) {
  const [tab, setTab] = useState<Tab>("summary");
  // Lazily mount a tab the first time it's opened, then keep it mounted (hidden)
  // so switching tabs doesn't lose in-progress quiz answers / flashcard position
  // or re-fetch. The whole panel is keyed by topic in PlanView, so it resets per
  // topic. (PanelTopic id doesn't change within a mount.)
  const [opened, setOpened] = useState<Set<Tab>>(() => new Set<Tab>(["summary"]));

  function selectTab(t: Tab) {
    setTab(t);
    setOpened((prev) => (prev.has(t) ? prev : new Set(prev).add(t)));
  }

  function panelFor(t: Tab) {
    if (t === "summary") return <TopicSummary topicId={topic.id} />;
    if (t === "chat") return isPaid ? <ChatBox endpoint={`/api/topics/${topic.id}/chat`} /> : <UpgradePrompt feature="Ask Claude" />;
    if (t === "flashcards") return isPaid ? <FlashcardDeck topicId={topic.id} /> : <UpgradePrompt feature="Flashcards" />;
    return isPaid ? <Quiz topicId={topic.id} /> : <UpgradePrompt feature="Quizzes" />;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-start gap-2">
        <h3 className="flex-1 text-base font-semibold text-slate-900">{topic.title}</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs ${difficultyColor[topic.difficulty]}`}>
          {difficultyLabel[topic.difficulty]}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-1 rounded-xl bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => selectTab(t.key)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
              tab === t.key ? "bg-background text-slate-900 shadow-sm" : "text-muted-foreground hover:text-slate-700"
            }`}
          >
            {t.label}
            {t.paid && !isPaid && (
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            )}
          </button>
        ))}
      </div>

      <div>
        {TABS.map((t) =>
          opened.has(t.key) ? (
            <div key={t.key} className={tab === t.key ? "" : "hidden"}>
              {panelFor(t.key)}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

function UpgradePrompt({ feature }: { feature: string }) {
  return (
    <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
      <p className="mb-3 text-sm text-amber-800">
        {feature} is a Premium feature. Upgrade to unlock AI tutoring, flashcards, and quizzes on every topic.
      </p>
      <Link
        href="/account"
        className="inline-block rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Upgrade to Premium
      </Link>
    </div>
  );
}
