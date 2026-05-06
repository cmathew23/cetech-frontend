"use client";

import { AccessGateLoadingState } from "@/components/access/AccessGateLoadingState";
import { isLoggingOut } from "@/lib/logoutClient";
import { useAuthGuard } from "@/middleware/authGuard";
import type { ReactNode } from "react";

/** Wraps role dashboards; access is decided entirely by `useAuthGuard`. */
export function DashboardGate({ children }: { children: ReactNode }) {
  const guard = useAuthGuard();

  if (isLoggingOut()) return null;

  if (guard.loading || !guard.allowed) {
    return <AccessGateLoadingState label="Loading access..." />;
  }

  return <>{children}</>;
}
