"use client";

import Link from "next/link";
import ChatBox from "@/components/ChatBox";

export default function CourseChat({ courseId, isPaid }: { courseId: string; isPaid: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h2 className="font-semibold text-slate-900">Ask Claude about this course</h2>
      </div>
      <p className="mb-1 text-xs text-slate-400">
        Your AI tutor, grounded on everything you&apos;ve uploaded here.
      </p>
      {isPaid ? (
        <ChatBox
          endpoint={`/api/courses/${courseId}/chat`}
          intro="Ask anything about this course — key concepts, how topics connect, or practice questions across the whole course."
          placeholder="Ask about this course…"
        />
      ) : (
        <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="mb-3 text-sm text-amber-800">
            The course tutor is a Premium feature. Upgrade to chat with an AI tutor that knows all your course material.
          </p>
          <Link
            href="/account"
            className="inline-block rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Upgrade to Premium
          </Link>
        </div>
      )}
    </div>
  );
}
