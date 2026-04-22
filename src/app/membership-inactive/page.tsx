"use client";

import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAuth } from "@/hooks/useAuth";
import {
  bootstrapRedirectsToMembershipInactive,
  bootstrapRequiresOnboardingResolution,
} from "@/lib/accessContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MembershipInactivePage() {
  const router = useRouter();
  const {
    isAuthenticated,
    loading,
    accessContext,
    accessGateReady,
    logout,
  } = useAuth();

  useEffect(() => {
    if (!accessGateReady) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (accessContext == null) {
      router.replace("/");
      return;
    }
    if (!bootstrapRedirectsToMembershipInactive(accessContext)) {
      router.replace(
        bootstrapRequiresOnboardingResolution(accessContext)
          ? "/onboarding"
          : "/",
      );
    }
  }, [accessGateReady, isAuthenticated, accessContext, router]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (loading || !accessGateReady) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-textSecondary">
        Loading…
      </div>
    );
  }

  if (
    !isAuthenticated ||
    !accessContext ||
    !bootstrapRedirectsToMembershipInactive(accessContext)
  ) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-textSecondary">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg px-4 py-10">
      <AuthCard title="Membership inactive">
        <p className="text-sm leading-relaxed text-textSecondary">
          Your access to this organization is no longer active. Your account
          still exists, but organization features are unavailable. Please contact
          your administrator if you think this is a mistake.
        </p>
        <div className="mt-6">
          <AuthButton type="button" onClick={() => void handleLogout()}>
            Log out
          </AuthButton>
        </div>
      </AuthCard>
    </div>
  );
}
