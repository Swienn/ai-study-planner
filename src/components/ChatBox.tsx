"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "@/components/Markdown";

type Message = { role: "user" | "assistant"; content: string };

/**
 * Reusable "Ask Claude" chat. `endpoint` handles GET (history) and POST
 * ({ message } → { reply }). Used for both per-topic and per-course chat.
 */
export default function ChatBox({
  endpoint,
  placeholder = "Ask a question…",
  intro = "Ask Claude anything about this — explanations, examples, or practice questions.",
}: {
  endpoint: string;
  placeholder?: string;
  intro?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadedHistory, setLoadedHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetch(endpoint)
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
  }, [endpoint]);

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
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Something went wrong");
      else setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2 rounded-xl border border-border bg-slate-50 p-3">
      <div ref={scrollRef} className="mb-2 flex max-h-72 flex-col gap-2 overflow-y-auto">
        {loadedHistory && messages.length === 0 && (
          <p className="py-3 text-center text-xs text-slate-400">{intro}</p>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div
              key={i}
              className="max-w-[85%] self-end whitespace-pre-wrap rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground"
            >
              {m.content}
            </div>
          ) : (
            <div
              key={i}
              className="max-w-[85%] self-start rounded-xl border border-border bg-background px-3 py-2 text-slate-700"
            >
              <Markdown>{m.content}</Markdown>
            </div>
          )
        )}
        {loading && (
          <div className="max-w-[85%] self-start rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-400">
            Thinking…
          </div>
        )}
      </div>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      <form onSubmit={send} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
