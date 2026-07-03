"use client";

import { useState } from "react";
import Link from "next/link";
import TopicChat from "./TopicChat";
import TopicSummary from "./TopicSummary";
import FlashcardDeck from "./FlashcardDeck";
import Quiz from "./Quiz";

type Panel = "summary" | "chat" | "flashcards" | "quiz" | null;

function ToolButton({
  active,
  locked,
  onClick,
  children,
}: {
  active: boolean;
  locked?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
        active ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
      }`}
    >
      {children}
      {locked && (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      )}
    </button>
  );
}

export default function TopicStudyTools({ topicId, isPaid }: { topicId: string; isPaid: boolean }) {
  const [panel, setPanel] = useState<Panel>(null);

  function toggle(p: Panel) {
    setPanel((cur) => (cur === p ? null : p));
  }

  return (
    <div className="mt-1.5 pl-8">
      <div className="flex items-center gap-1 flex-wrap">
        <ToolButton active={panel === "summary"} onClick={() => toggle("summary")}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Summary
        </ToolButton>
        <ToolButton active={panel === "chat"} locked={!isPaid} onClick={() => toggle("chat")}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Ask Claude
        </ToolButton>
        <ToolButton active={panel === "flashcards"} locked={!isPaid} onClick={() => toggle("flashcards")}>
          Flashcards
        </ToolButton>
        <ToolButton active={panel === "quiz"} locked={!isPaid} onClick={() => toggle("quiz")}>
          Quiz
        </ToolButton>
      </div>

      {panel === "summary" && <TopicSummary topicId={topicId} />}

      {panel === "chat" &&
        (isPaid ? <TopicChat topicId={topicId} /> : <UpgradePrompt feature="Ask Claude" />)}

      {panel === "flashcards" &&
        (isPaid ? <FlashcardDeck topicId={topicId} /> : <UpgradePrompt feature="Flashcards" />)}

      {panel === "quiz" &&
        (isPaid ? <Quiz topicId={topicId} /> : <UpgradePrompt feature="Quizzes" />)}
    </div>
  );
}

function UpgradePrompt({ feature }: { feature: string }) {
  return (
    <div className="mt-2 border border-amber-200 bg-amber-50 rounded-xl p-4 text-center">
      <p className="text-sm text-amber-800 mb-3">
        {feature} is a Premium feature. Upgrade to unlock AI tutoring, flashcards, and quizzes on every topic.
      </p>
      <Link
        href="/account"
        className="inline-block text-sm px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
      >
        Upgrade to Premium
      </Link>
    </div>
  );
}
