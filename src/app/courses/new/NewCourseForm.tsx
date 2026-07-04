"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UpgradeBanner from "@/components/UpgradeBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const COLORS = [
  { value: "blue", label: "Blue", dot: "bg-blue-500" },
  { value: "purple", label: "Purple", dot: "bg-purple-500" },
  { value: "green", label: "Green", dot: "bg-green-500" },
  { value: "orange", label: "Orange", dot: "bg-orange-500" },
  { value: "red", label: "Red", dot: "bg-red-500" },
  { value: "yellow", label: "Yellow", dot: "bg-yellow-400" },
];

export default function NewCourseForm() {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("blue");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitHit, setLimitHit] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLimitHit(false);
    setLoading(true);

    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, color }),
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 403) setLimitHit(true);
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }
    router.push(`/courses/${data.course.id}`);
  }

  return (
    <div className="p-6 pt-10">
      <div className="mx-auto max-w-md">
        <Link href="/dashboard" className="mb-4 inline-block text-sm text-slate-400 transition-colors hover:text-slate-700">
          ← Courses
        </Link>
        <h1 className="mb-1 text-2xl font-bold text-slate-900">New course</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Create a course for each subject — then upload PDFs and build a study plan.
        </p>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Course name</Label>
                <Input
                  id="title"
                  type="text"
                  required
                  placeholder="e.g. Linear Algebra"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Colour</Label>
                <div className="flex gap-2.5">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={`h-8 w-8 rounded-full ${c.dot} transition-transform ${
                        color === c.value ? "scale-125 ring-2 ring-indigo-400 ring-offset-2" : "hover:scale-110"
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
              {limitHit && error ? (
                <UpgradeBanner message={error} />
              ) : error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
              <Button
                type="submit"
                disabled={loading || limitHit}
                className="bg-brand-gradient w-full border-0 hover:opacity-90"
              >
                {loading ? "Creating…" : "Create course"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
