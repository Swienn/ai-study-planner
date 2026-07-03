"use client";

import { useState } from "react";

/**
 * App layout shell with a responsive sidebar.
 * Desktop (lg+): sidebar is a fixed left column.
 * Mobile: sidebar is hidden behind a hamburger → slide-over drawer.
 *
 * `topbar` and `sidebar` are server components passed in as props (rendered on
 * the server, so they can fetch data), which is why this client shell only owns
 * the open/close state.
 */
export default function SidebarShell({
  topbar,
  sidebar,
  children,
}: {
  topbar: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-lg p-1.5 text-slate-600 hover:bg-accent lg:hidden"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>
        {topbar}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 flex-shrink-0 overflow-y-auto border-r border-border bg-slate-50 lg:block">
          {sidebar}
        </aside>

        {/* Mobile drawer */}
        <div className={`fixed inset-0 z-40 lg:hidden ${open ? "" : "pointer-events-none"}`}>
          <div
            onClick={() => setOpen(false)}
            className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          />
          <aside
            className={`absolute left-0 top-0 h-full w-64 overflow-y-auto border-r border-border bg-slate-50 shadow-xl transition-transform duration-200 ${
              open ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex justify-end p-2">
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-accent"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {sidebar}
          </aside>
        </div>

        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  );
}
