"use client";

import { designSystem } from "@/config/design-system";

export function AccessGateLoadingState({
  label = "Loading access...",
  minHeightClassName = "min-h-[40vh]",
}: {
  label?: string;
  minHeightClassName?: string;
}) {
  return (
    <div
      className={`flex w-full items-center justify-center ${minHeightClassName}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3">
        <span
          className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary"
          aria-hidden="true"
        />
        <p className={designSystem.typography.muted}>{label}</p>
      </div>
    </div>
  );
}
