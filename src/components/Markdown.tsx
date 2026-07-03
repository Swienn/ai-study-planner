"use client";

import ReactMarkdown from "react-markdown";

// Renders assistant/study Markdown into styled HTML. react-markdown does NOT
// render raw HTML by default, so this is safe from HTML injection. Styling is
// applied with Tailwind arbitrary-variant selectors so we don't need the
// typography plugin (and avoid passing react-markdown's `node` prop to the DOM).
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="text-sm leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_li]:mb-0.5 [&_strong]:font-semibold [&_strong]:text-slate-900 [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_h1]:mt-2 [&_h2]:mt-2 [&_h3]:mt-2 [&_h1]:mb-1 [&_h2]:mb-1 [&_h3]:mb-1 [&_code]:bg-slate-100 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_a]:text-indigo-600 [&_a]:underline">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
