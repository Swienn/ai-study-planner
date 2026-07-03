"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "@/components/Markdown";

type Message = { role: "user" | "assistant"; content: string };

export default function TopicChat({ topicId }: { topicId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadedHistory, setLoadedHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/topics/${topicId}/chat`)
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((data) => {
        if (active && Array.isArray(data.messages)) {
          setMessages(data.messages.map((m: Message) => ({ role: m.role, content: m.content })));
        }
      })
      .catch(() => {})
      .finally(() => active && setLoadedHistory(true));
    return () => {
      active = false;
    };
  }, [topicId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/topics/${topicId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2 border border-slate-200 rounded-xl bg-slate-50 p-3">
      <div ref={scrollRef} className="max-h-64 overflow-y-auto flex flex-col gap-2 mb-2">
        {loadedHistory && messages.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-3">
            Ask Claude anything about this topic — explanations, examples, or practice questions.
          </p>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div
              key={i}
              className="text-sm rounded-xl px-3 py-2 max-w-[85%] whitespace-pre-wrap bg-indigo-600 text-white self-end"
            >
              {m.content}
            </div>
          ) : (
            <div
              key={i}
              className="rounded-xl px-3 py-2 max-w-[85%] bg-white border border-slate-200 text-slate-700 self-start"
            >
              <Markdown>{m.content}</Markdown>
            </div>
          )
        )}
        {loading && (
          <div className="text-sm rounded-xl px-3 py-2 bg-white border border-slate-200 text-slate-400 self-start">
            Thinking…
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <form onSubmit={send} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
