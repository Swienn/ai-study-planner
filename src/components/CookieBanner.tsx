"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("cookie_consent");
    if (!accepted) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("cookie_consent", "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-4 flex flex-col gap-3">
      <p className="text-sm text-slate-600">
        We use a session cookie to keep you logged in. No tracking or advertising cookies.{" "}
        <Link href="/privacy" className="text-indigo-600 hover:underline">
          Privacy policy
        </Link>
      </p>
      <button
        onClick={accept}
        className="self-end px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Got it
      </button>
    </div>
  );
}
