"use client";

import { useAuth } from "@/hooks/useAuth";
import {
  bootstrapAthleteRequiresInvitationInbox,
  bootstrapRequiresOnboardingResolution,
  dashboardPathFromAppContextWhenReady,
} from "@/lib/accessContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * App-context owns athlete route resolution, same pattern as other roles.
 * Legacy invitation-gate redirects must not compete with /me/app-context decisions.
 */
export function AthleteRouteGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { accessContext, accessGateReady } = useAuth();

  useEffect(() => {
    if (!accessGateReady || !accessContext) return;

    if (bootstrapAthleteRequiresInvitationInbox(accessContext)) {
      if (
        pathname !== "/athlete/invitations" &&
        !pathname.startsWith("/athlete/invitations/")
      ) {
        router.replace("/athlete/invitations");
      }
      return;
    }

    if (bootstrapRequiresOnboardingResolution(accessContext)) {
      if (pathname !== "/onboarding" && !pathname.startsWith("/onboarding/")) {
        router.replace("/onboarding");
      }
      return;
    }

    const dashboardPath = dashboardPathFromAppContextWhenReady(accessContext);
    if (dashboardPath === "/athlete/dashboard") {
      return;
    }

    // Safe fallback for unexpected non-ready athlete combinations.
    if (pathname.startsWith("/athlete/")) {
      router.replace("/onboarding");
    }
  }, [accessContext, accessGateReady, pathname, router]);

  return <>{children}</>;
}
