"use client";

import { InvitationInboxSection } from "@/components/invitations/InvitationInboxSection";
import { dashboardPanelClass } from "@/lib/auth-ui";

/**
 * Coach invitation inbox — reachable before onboarding COMPLETE (mirrors /athlete/invitations).
 * Same data as dashboard inbox; separated so login/onboarding can route here under DashboardGate.
 */
export default function CoachInvitationsPage() {
  return (
    <div className="w-full max-w-4xl space-y-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Invitations
        </h2>
        <p className="text-base text-gray-500">
          Pending academy invitations. Accept or decline to continue.
        </p>
      </header>

      <InvitationInboxSection className={dashboardPanelClass} />
    </div>
  );
}
