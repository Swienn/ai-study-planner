"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COLORS = [
  { value: "blue",   label: "Blue",   dot: "bg-blue-500" },
  { value: "purple", label: "Purple", dot: "bg-purple-500" },
  { value: "green",  label: "Green",  dot: "bg-green-500" },
  { value: "orange", label: "Orange", dot: "bg-orange-500" },
  { value: "red",    label: "Red",    dot: "bg-red-500" },
  { value: "yellow", label: "Yellow", dot: "bg-yellow-400" },
];

export default function NewCourseForm() {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("blue");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, color }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    router.push(`/courses/${data.course.id}`);
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6">New course</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Course name</label>
            <input
              type="text"
              required
              placeholder="e.g. Linear Algebra"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Colour</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full ${c.dot} transition-transform ${
                    color === c.value ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : ""
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create course"}
          </button>
        </form>
      </div>
    </main>
  );
}
