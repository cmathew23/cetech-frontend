"use client";

import { DASHBOARD_PAGE_CONTENT_CLASS } from "@/components/dashboard/shared/dashboardOuterCardStyles";
import { InvitationInboxSection } from "@/components/invitations/InvitationInboxSection";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { routeFromAccessContext } from "@/lib/accessContext";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function CoachDashboardInvitationsPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();

  async function handleActionComplete() {
    const session = await refreshSession();
    const nextRoute = routeFromAccessContext(session?.accessContext);
    if (nextRoute && nextRoute !== "/coach/dashboard/invitations") {
      router.replace(nextRoute);
    }
  }

  return (
    <div className={cn(DASHBOARD_PAGE_CONTENT_CLASS, "space-y-4")}>
      <PageHeader
        title="Invitations"
        subtitle="Pending academy invitations. Accept or decline to continue."
      />

      <InvitationInboxSection
        showTitle={false}
        onActionComplete={handleActionComplete}
      />
    </div>
  );
}
