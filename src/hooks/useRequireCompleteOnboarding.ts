"use client";

import { useAuthGuard } from "@/middleware/authGuard";

/**
 * Compatibility wrapper over canonical guard (`useAuthGuard` in `@/middleware/authGuard`).
 * Dashboard access requires GET /onboarding/status → `COMPLETE`, same rule as `resolvePostLoginDestination`.
 */
export function useRequireCompleteOnboarding() {
  const { allowed } = useAuthGuard();
  return allowed;
}
