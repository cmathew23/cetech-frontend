"use client";

import { Bot } from "lucide-react";

export function FynAvatar({
  className = "",
}: {
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950/95 shadow-[0_10px_24px_rgba(15,23,42,0.16)] ring-1 ring-slate-200/70 ${className}`}
      aria-hidden="true"
    >
      <Bot className="h-5 w-5 text-slate-50 sm:h-6 sm:w-6" aria-label="Fyn Assistant avatar" />
    </span>
  );
}
