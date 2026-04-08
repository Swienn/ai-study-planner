"use client";

import Link from "next/link";

export default function UpgradeBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
      <svg
        className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
        />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-900">Free plan limit reached</p>
        <p className="text-xs text-amber-700 mt-0.5">{message}</p>
      </div>
      <Link
        href="/account"
        className="flex-shrink-0 text-xs px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium whitespace-nowrap"
      >
        Upgrade →
      </Link>
    </div>
  );
}
