"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeletePlanButton({ planId, courseId }: { planId: string; courseId?: string | null }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/plans/${planId}`, { method: "DELETE" });
    if (courseId) {
      router.push(`/courses/${courseId}`);
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Delete this plan?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-sm px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm text-gray-400 hover:text-red-600 transition-colors"
    >
      Delete plan
    </button>
  );
}
