"use client";

import { CoachWeeklyAdherenceOverview } from "@/components/dashboard/coach/CoachWeeklyAdherenceOverview";
import { InvitationInboxSection } from "@/components/invitations/InvitationInboxSection";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { routeFromAccessContext } from "@/lib/accessContext";
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
    <div className="w-full max-w-4xl space-y-4">
      <PageHeader
        title="Invitations"
        subtitle="Pending academy invitations. Accept or decline to continue."
      />

      <CoachWeeklyAdherenceOverview />

      <InvitationInboxSection
        showTitle={false}
        onActionComplete={handleActionComplete}
      />
    </div>
  );
}
