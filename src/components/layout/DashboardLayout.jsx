"use client";

import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function DashboardLayout({ sidebar, children, className = "" }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function maybeCloseSidebarOnNavClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("a")) {
      setSidebarOpen(false);
    }
  }

  return (
    <div className={cn(designSystem.layout.page, "relative", className)}>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
        {sidebar}
      </aside>

      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <aside
        id="dashboard-mobile-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] -translate-x-full transition-transform duration-200 ease-out lg:hidden",
          sidebarOpen && "translate-x-0",
        )}
        aria-label="Mobile sidebar"
        onClickCapture={maybeCloseSidebarOnNavClick}
      >
        {sidebar}
      </aside>

      <main className={cn(designSystem.layout.main, "min-w-0 max-w-full")}>
        <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="lg:hidden">
            <button
              type="button"
              className="inline-flex items-center rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-textPrimary shadow-sm"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-expanded={sidebarOpen}
              aria-controls="dashboard-mobile-sidebar"
            >
              {sidebarOpen ? "Close menu" : "Open menu"}
            </button>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
