"use client";

import { InvitationRequiredScreen } from "@/components/access/InvitationRequiredScreen";
import { AccessGateLoadingState } from "@/components/access/AccessGateLoadingState";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useAuth } from "@/hooks/useAuth";
import { useSharedLogout } from "@/hooks/useSharedLogout";
import {
  bootstrapRequiresInvitationRequiredRoute,
  routeFromAccessContext,
} from "@/lib/accessContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function InvitationRequiredPage() {
  const router = useRouter();
  const logout = useSharedLogout();
  const { isAuthenticated, loading, accessContext, accessGateReady } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !accessGateReady) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (bootstrapRequiresInvitationRequiredRoute(accessContext)) {
      return;
    }
    const nextRoute = routeFromAccessContext(accessContext);
    router.replace(nextRoute ?? "/onboarding");
  }, [accessContext, accessGateReady, isAuthenticated, loading, router]);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await logout();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !accessGateReady) {
    return <AccessGateLoadingState minHeightClassName="min-h-screen" />;
  }

  if (!isAuthenticated || !bootstrapRequiresInvitationRequiredRoute(accessContext)) {
    return <AccessGateLoadingState minHeightClassName="min-h-screen" />;
  }

  return (
    <ProtectedLayout mode="auth-only">
      <InvitationRequiredScreen onConfirm={handleConfirm} busy={submitting} />
    </ProtectedLayout>
  );
}
