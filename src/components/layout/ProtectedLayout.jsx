"use client";

import { AccessGateLoadingState } from "@/components/access/AccessGateLoadingState";
import { useAuth } from "@/hooks/useAuth";
import { useAuthGuard } from "@/middleware/authGuard";

/**
 * Guardrail:
 * - Default mode is "complete" so future protected app pages require COMPLETE onboarding.
 * - Use mode="auth-only" only for routes like /onboarding.
 */
function CompleteProtectedLayout({ children }) {
  const guard = useAuthGuard();

  if (guard.loading) {
    return <AccessGateLoadingState label="Loading access..." />;
  }
  if (!guard.allowed) {
    return null;
  }
  return children;
}

function AuthOnlyProtectedLayout({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AccessGateLoadingState label="Loading access..." minHeightClassName="min-h-screen" />;
  }

  if (!user) {
    return null;
  }

  return children;
}

export function ProtectedLayout({ children, mode = "complete" }) {
  if (mode === "complete") {
    return <CompleteProtectedLayout>{children}</CompleteProtectedLayout>;
  }

  return <AuthOnlyProtectedLayout>{children}</AuthOnlyProtectedLayout>;
}
