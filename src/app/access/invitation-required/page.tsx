"use client";

import { InvitationRequiredScreen } from "@/components/access/InvitationRequiredScreen";
import { AccessGateLoadingState } from "@/components/access/AccessGateLoadingState";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useAuth } from "@/hooks/useAuth";
import {
  bootstrapRequiresInvitationRequiredRoute,
  routeFromAccessContext,
} from "@/lib/accessContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function InvitationRequiredPage() {
  const router = useRouter();
  const { isAuthenticated, loading, accessContext, accessGateReady, logout } = useAuth();
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
      router.replace("/login");
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
