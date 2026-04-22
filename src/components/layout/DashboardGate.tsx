"use client";

import { designSystem } from "@/config/design-system";
import { useRequireCompleteOnboarding } from "@/hooks/useRequireCompleteOnboarding";
import type { ReactNode } from "react";

/** Wraps role dashboards; requires onboarding COMPLETE (`useAuthGuard`). Aligns with `@/lib/post-login-route`. */
export function DashboardGate({ children }: { children: ReactNode }) {
  const allowed = useRequireCompleteOnboarding();

  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] w-full items-center justify-center">
        <p className={designSystem.typography.muted}>Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
