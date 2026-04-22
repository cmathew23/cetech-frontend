"use client";

import { useAuth } from "@/hooks/useAuth";
import { useAuthGuard } from "@/middleware/authGuard";

/**
 * Guardrail:
 * - Default mode is "complete" so future protected app pages require COMPLETE onboarding.
 * - Use mode="auth-only" only for routes like /onboarding.
 */
export function ProtectedLayout({ children, mode = "complete" }) {
  const guard = useAuthGuard();
  const { user, loading } = useAuth();

  if (mode === "complete") {
    if (guard.loading) {
      return "Loading...";
    }
    if (!guard.allowed) {
      return null;
    }
    return children;
  }

  if (loading) {
    return "Loading...";
  }

  if (!user) {
    return null;
  }

  return children;
}
