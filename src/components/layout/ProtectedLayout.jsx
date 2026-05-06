"use client";

import { AccessGateLoadingState } from "@/components/access/AccessGateLoadingState";
import { useAuth } from "@/hooks/useAuth";
import { getToken } from "@/lib/auth";
import { isLoggingOut } from "@/lib/logoutClient";
import { useAuthGuard } from "@/middleware/authGuard";
import { useEffect } from "react";

/**
 * Guardrail:
 * - Default mode is "complete" so future protected app pages require COMPLETE onboarding.
 * - Use mode="auth-only" only for routes like /onboarding.
 */
function CompleteProtectedLayout({ children }) {
  const guard = useAuthGuard();

  if (isLoggingOut()) return null;

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
  const hasToken = Boolean(getToken());

  useEffect(() => {
    if (isLoggingOut()) return;
    if (loading) return;
    if (!user || !hasToken) {
      window.location.replace("/login");
    }
  }, [hasToken, loading, user]);

  if (isLoggingOut()) return null;

  if (loading) {
    return <AccessGateLoadingState label="Loading access..." minHeightClassName="min-h-screen" />;
  }

  if (!user || !hasToken) {
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
